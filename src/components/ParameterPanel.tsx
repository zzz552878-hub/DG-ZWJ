import { Gauge, Layers, Waves } from "lucide-react";
import type { OpacitySettings, Parameters, RiskMode } from "../types";

interface ParameterPanelProps {
  parameters: Parameters;
  opacity: OpacitySettings;
  riskMode: RiskMode;
  onParameterChange: (key: keyof Parameters, value: number) => void;
  onOpacityChange: (key: keyof OpacitySettings, value: number) => void;
  onRiskModeChange: (mode: RiskMode) => void;
}

const parameterRows: Array<{
  key: keyof Parameters;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "pressure", label: "注浆压力", unit: "MPa", min: 0.1, max: 0.75, step: 0.01 },
  { key: "flow", label: "注浆流量", unit: "L/min", min: 120, max: 420, step: 5 },
  { key: "volume", label: "注浆量", unit: "m³/环", min: 3.2, max: 8.2, step: 0.1 },
  { key: "advanceSpeed", label: "盾构推进速度", unit: "mm/min", min: 15, max: 65, step: 1 },
  { key: "settlement", label: "地表沉降", unit: "mm", min: -12, max: 6, step: 0.1 }
];

const riskModes: Array<{ id: RiskMode; label: string }> = [
  { id: "normal", label: "正常注浆" },
  { id: "low", label: "注浆不足" },
  { id: "high", label: "压力过大" }
];

const opacityRows: Array<{ key: keyof OpacitySettings; label: string }> = [
  { key: "shield", label: "盾体" },
  { key: "segment", label: "管片" },
  { key: "soil", label: "地层" },
  { key: "grout", label: "浆液层" }
];

export function ParameterPanel({
  parameters,
  opacity,
  riskMode,
  onParameterChange,
  onOpacityChange,
  onRiskModeChange
}: ParameterPanelProps) {
  return (
    <section className="glass-panel parameter-panel">
      <h3>
        <Gauge size={18} />
        实时参数控制
      </h3>

      <div className="risk-mode-group" role="group" aria-label="注浆风险模拟">
        {riskModes.map((mode) => (
          <button
            className={riskMode === mode.id ? "mode-chip active" : "mode-chip"}
            key={mode.id}
            onClick={() => onRiskModeChange(mode.id)}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="parameter-list">
        {parameterRows.map((row) => (
          <label className="parameter-row" key={row.key}>
            <span>
              {row.label}
              <b>
                {parameters[row.key].toFixed(row.step < 1 ? 2 : 0)} {row.unit}
              </b>
            </span>
            <input
              aria-label={row.label}
              max={row.max}
              min={row.min}
              onChange={(event) => onParameterChange(row.key, Number(event.target.value))}
              step={row.step}
              type="range"
              value={parameters[row.key]}
            />
          </label>
        ))}
      </div>

      <div className="inline-divider" />

      <h3>
        <Layers size={18} />
        透明观察
      </h3>
      <div className="opacity-mini-grid">
        {opacityRows.map((row) => (
          <label key={row.key}>
            <span>{row.label}</span>
            <input
              aria-label={`${row.label}透明度`}
              max={100}
              min={12}
              onChange={(event) => onOpacityChange(row.key, Number(event.target.value) / 100)}
              type="range"
              value={Math.round(opacity[row.key] * 100)}
            />
          </label>
        ))}
      </div>

      <div className="flow-summary">
        <Waves size={18} />
        <span>参数变化会联动浆液粒子速度、发光强度、沉降曲线和风险提示。</span>
      </div>
    </section>
  );
}
