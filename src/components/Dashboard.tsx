import { Activity, BarChart3, GaugeCircle, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import type { Parameters } from "../types";
import { normalize } from "../utils/engineering";

interface DashboardProps {
  parameters: Parameters;
  riskMode: "normal" | "low" | "high";
}

export function Dashboard({ parameters, riskMode }: DashboardProps) {
  const pressureRatio = normalize(parameters.pressure, 0.1, 0.75);
  const flowRatio = normalize(parameters.flow, 120, 420);
  const volumeRatio = normalize(parameters.volume, 3.2, 8.2);

  const curve = useMemo(() => {
    const points = Array.from({ length: 18 }, (_, index) => {
      const x = index * 14;
      const drift =
        riskMode === "low"
          ? -index * 0.28 - Math.sin(index * 0.8) * 1.1
          : riskMode === "high"
            ? Math.sin(index * 0.7) * 1.2 + index * 0.08
            : Math.sin(index * 0.7) * 0.45 - index * 0.04;
      const y = 42 - drift * 4 - normalize(parameters.settlement, -12, 6) * 18;
      return `${x},${Math.max(8, Math.min(76, y))}`;
    });
    return points.join(" ");
  }, [parameters.settlement, riskMode]);

  const needle = -125 + pressureRatio * 250;

  return (
    <section className="dashboard">
      <article className="monitor-tile gauge-tile">
        <div className="tile-title">
          <GaugeCircle size={16} />
          压力表
        </div>
        <svg viewBox="0 0 120 76" className="gauge-svg" role="img" aria-label="压力表">
          <path d="M18 62 A42 42 0 0 1 102 62" className="gauge-track" />
          <path d="M18 62 A42 42 0 0 1 102 62" className="gauge-value" style={{ strokeDashoffset: 132 - pressureRatio * 132 }} />
          <line x1="60" y1="62" x2="60" y2="26" className="gauge-needle" transform={`rotate(${needle} 60 62)`} />
          <circle cx="60" cy="62" r="4" />
        </svg>
        <strong>{parameters.pressure.toFixed(2)} MPa</strong>
      </article>

      <article className="monitor-tile">
        <div className="tile-title">
          <BarChart3 size={16} />
          流量条
        </div>
        <div className="meter-bar">
          <span style={{ width: `${flowRatio * 100}%` }} />
        </div>
        <strong>{Math.round(parameters.flow)} L/min</strong>
      </article>

      <article className="monitor-tile">
        <div className="tile-title">
          <Activity size={16} />
          注浆量
        </div>
        <div className="meter-bar volume">
          <span style={{ width: `${volumeRatio * 100}%` }} />
        </div>
        <strong>{parameters.volume.toFixed(1)} m³/环</strong>
      </article>

      <article className="monitor-tile curve-tile">
        <div className="tile-title">
          <TrendingDown size={16} />
          地表沉降曲线
        </div>
        <svg viewBox="0 0 238 88" className="curve-svg" role="img" aria-label="地表沉降曲线">
          <path d="M0 44 H238" className="curve-zero" />
          <polyline points={curve} className={`settlement-line ${riskMode}`} />
        </svg>
      </article>
    </section>
  );
}
