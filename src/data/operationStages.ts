import type { OperationStage } from "../types";

export const operationStages: OperationStage[] = [
  {
    id: "material",
    label: "材料准备",
    phase: "material",
    start: 0,
    end: 0.12,
    preset: "overview",
    component: "mixingTank",
    timelineStepId: "prepare",
    focusParts: ["rawMaterials", "mixingTank"],
    description: "原材料按配合比计量，并从进料口进入搅拌制浆系统。",
    narration: "同步注浆施工前，需要准备水泥、膨润土、粉煤灰、砂、水和外加剂等材料，并按照设计配合比进行计量。"
  },
  {
    id: "mixing",
    label: "浆液搅拌",
    phase: "mixing",
    start: 0.12,
    end: 0.25,
    preset: "overview",
    component: "mixingTank",
    timelineStepId: "mixing",
    focusParts: ["mixingTank", "mixingMotor", "mixingShaft"],
    description: "搅拌轴和叶片持续工作，使浆液达到均匀、稳定、可泵送状态。",
    narration: "材料进入搅拌罐后，通过搅拌轴和叶片充分混合，形成流动性、稳定性和可泵性满足要求的同步注浆浆液。"
  },
  {
    id: "storage",
    label: "储浆待用",
    phase: "storage",
    start: 0.25,
    end: 0.35,
    preset: "overview",
    component: "storageTank",
    timelineStepId: "testing",
    focusParts: ["slurryTank"],
    description: "浆液进入储浆罐，液位上升并保持连续供浆。",
    narration: "搅拌完成的浆液进入储浆罐暂存，储浆罐通过液位计和循环装置保证浆液连续供应，避免泵送中断。"
  },
  {
    id: "pumping",
    label: "注浆泵送",
    phase: "pumping",
    start: 0.35,
    end: 0.5,
    preset: "pump",
    component: "groutPump",
    timelineStepId: "pump",
    focusParts: ["groutPump", "pressureGauge", "flowMeter"],
    description: "注浆泵加压输出，压力表和流量计实时反馈泵送状态。",
    narration: "注浆泵将储浆罐中的浆液加压输出，压力表和流量计实时反馈泵送状态，保证注浆压力和注浆量符合施工要求。"
  },
  {
    id: "pipeline",
    label: "管路输送",
    phase: "pipeline",
    start: 0.5,
    end: 0.65,
    preset: "flow",
    component: "pipeline",
    timelineStepId: "pump",
    focusParts: ["mainPipeline", "valveGroup", "branchPipelines"],
    description: "浆液沿主管、分配阀组和支管流动，分配到多个盾尾注浆支路。",
    narration: "浆液经过主管路、分配阀组和支管输送到盾尾周边。多支路布置可以让浆液更加均匀地进入管片外侧空隙。"
  },
  {
    id: "tailInjection",
    label: "盾尾多点注浆",
    phase: "tailInjection",
    start: 0.65,
    end: 0.8,
    preset: "tail",
    component: "injectionPort",
    timelineStepId: "tail",
    focusParts: ["groutPorts", "shieldTail", "branchPipelines", "segmentGap"],
    description: "8 个盾尾注浆口沿环向向建筑空隙同步注浆。",
    narration: "盾尾注浆口沿盾尾环向布置，盾构推进时，浆液通过多个注浆口同步进入建筑空隙，实现边推进、边拼装、边注浆。"
  },
  {
    id: "gapFill",
    label: "空隙填充",
    phase: "gapFill",
    start: 0.8,
    end: 0.92,
    preset: "gap",
    component: "groutLayer",
    timelineStepId: "settlement",
    focusParts: ["segmentGap", "groutLayer"],
    description: "浆液在管片外侧环形空隙中扩散，逐步形成连续填充层。",
    narration: "浆液进入管片外侧空隙后逐渐扩散，填充盾尾脱出后形成的环形空隙，减少地层损失和管片背后空洞。"
  },
  {
    id: "stabilize",
    label: "地层稳定",
    phase: "stabilize",
    start: 0.92,
    end: 1,
    preset: "gap",
    component: "soilLayer",
    timelineStepId: "adjust",
    focusParts: ["soilLayer", "segmentRing", "groutLayer"],
    description: "浆液连续填充后，沉降曲线趋稳，显示质量稳定。",
    narration: "当浆液连续均匀填充后，可以有效控制地表沉降，稳定管片姿态，提高隧道成型质量。"
  }
];

export function getOperationStage(progress: number) {
  return (
    operationStages.find((stage) => progress >= stage.start && progress < stage.end) ??
    operationStages[operationStages.length - 1]
  );
}
