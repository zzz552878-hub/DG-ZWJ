import type { TimelineStep } from "../types";

export const timelineSteps: TimelineStep[] = [
  {
    id: "prepare",
    index: 1,
    label: "材料准备",
    phase: "material",
    preset: "overview",
    message: "检查水泥、粉煤灰、膨润土、水与外加剂，确认配比和供应连续性。"
  },
  {
    id: "mixing",
    index: 2,
    label: "浆液搅拌",
    phase: "mixing",
    preset: "overview",
    message: "搅拌制浆罐启动，形成均匀、可泵送、凝结时间匹配的同步注浆浆液。"
  },
  {
    id: "testing",
    index: 3,
    label: "性能检测",
    phase: "storage",
    preset: "pump",
    message: "检测稠度、泌水率、凝结时间和密度，异常时先修正配比再进入泵送。"
  },
  {
    id: "pump",
    index: 4,
    label: "泵送输浆",
    phase: "pumping",
    preset: "pump",
    message: "注浆泵稳定加压，压力表和流量计同步反馈，主管路开始发光流动。"
  },
  {
    id: "tail",
    index: 5,
    label: "盾尾同步注浆",
    phase: "tailInjection",
    preset: "tail",
    message: "盾尾脱出形成空隙后，多点注浆口立即注入，体现边推进、边拼装、边注浆。"
  },
  {
    id: "settlement",
    index: 6,
    label: "沉降监测",
    phase: "gapFill",
    preset: "gap",
    message: "观察地表沉降曲线和浆液填充层，判断空隙是否及时饱满。"
  },
  {
    id: "adjust",
    index: 7,
    label: "参数修正",
    phase: "stabilize",
    preset: "flow",
    message: "根据压力、流量、注浆量与沉降反馈，调整泵送和各点阀门开度。"
  }
];

export const operationPhases = [
  "材料配制",
  "搅拌制浆",
  "储浆",
  "注浆泵送",
  "管路输送",
  "盾尾多点注入",
  "空隙填充",
  "地层稳定"
];
