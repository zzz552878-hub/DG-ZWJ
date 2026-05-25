import type { Parameters, RiskMode } from "../types";

export const defaultParameters: Parameters = {
  pressure: 0.35,
  flow: 260,
  volume: 5.8,
  advanceSpeed: 38,
  settlement: -2.2
};

export const riskPresets: Record<RiskMode, Parameters> = {
  normal: defaultParameters,
  low: {
    pressure: 0.18,
    flow: 165,
    volume: 3.9,
    advanceSpeed: 46,
    settlement: -8.5
  },
  high: {
    pressure: 0.62,
    flow: 340,
    volume: 7.6,
    advanceSpeed: 28,
    settlement: 3.6
  }
};

export function classifyRisk(parameters: Parameters, selectedMode: RiskMode) {
  if (selectedMode === "low" || parameters.pressure < 0.24 || parameters.volume < 4.6) {
    return {
      mode: "low" as const,
      label: "注浆不足",
      tone: "danger",
      status: "填充不足风险",
      hints: ["填充不足", "地表沉降", "管片错台"],
      description: "压力或注浆量偏低，盾尾空隙难以及时饱满，沉降曲线会明显下探。"
    };
  }

  if (selectedMode === "high" || parameters.pressure > 0.52 || parameters.volume > 7.1) {
    return {
      mode: "high" as const,
      label: "注浆压力过大",
      tone: "warning",
      status: "过压隆起风险",
      hints: ["地层隆起", "浆液外漏", "管片上浮"],
      description: "压力或注浆量偏高，可能突破薄弱通道并扰动地层，需降低泵压并核查阀门。"
    };
  }

  return {
    mode: "normal" as const,
    label: "正常注浆",
    tone: "stable",
    status: "质量稳定",
    hints: ["填充及时", "压力稳定", "沉降可控"],
    description: "压力、流量和每环注浆量处于合理区间，监测反馈显示地层稳定。"
  };
}

export function normalize(value: number, min: number, max: number) {
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export function formatNumber(value: number, digits = 1) {
  return value.toFixed(digits);
}
