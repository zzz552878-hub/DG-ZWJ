import type { QuizQuestion, TeachingStep } from "../types";

export const teachingSteps: TeachingStep[] = [
  {
    id: "gap",
    title: "第1步：认识盾尾空隙",
    description: "盾构机向前推进后，管片外壁与开挖轮廓之间会形成环形建筑空隙。这个区域是同步注浆最核心的填充目标。",
    narration: "盾构机向前推进后，管片外壁与开挖轮廓之间会形成环形建筑空隙。如果这个空隙不能及时填充，就可能造成地层损失、地表沉降和管片姿态不稳定。",
    focus: "管片外侧建筑空隙、盾尾、管片外壁、地层剖面",
    observation: "观察盾尾脱出后的管片外侧环形空间，以及空隙与地层之间的相对关系。",
    focusParts: ["segmentGap", "shieldTail", "segmentRing", "soilLayer"],
    timelineStepId: "settlement",
    preset: "gap",
    component: "annularGap"
  },
  {
    id: "position",
    title: "第2步：同步注浆位置",
    description: "盾尾周边的多个注浆口把浆液压入管片外侧空隙，注浆位置位于盾尾后方、管片外侧和地层之间。",
    narration: "同步注浆系统通过盾尾周边的多个注浆口，将浆液压入管片外侧空隙。注浆位置主要位于盾尾后方、管片外侧和地层之间。",
    focus: "盾尾多点注浆口、管片外侧空隙、浆液填充层",
    observation: "观察环向 8 个注浆口如何指向管片背后的建筑空隙。",
    focusParts: ["groutPorts", "segmentGap", "groutLayer"],
    timelineStepId: "tail",
    preset: "tail",
    component: "injectionPort"
  },
  {
    id: "path",
    title: "第3步：浆液输送路径",
    description: "浆液从搅拌制浆系统进入储浆罐，再由注浆泵加压，经过主管路、分配阀组和支管到达盾尾注浆口。",
    narration: "浆液从搅拌制浆系统进入储浆罐，再由注浆泵加压输送，经过主管路、分配阀组和支管，最终到达盾尾注浆口。",
    focus: "搅拌罐、储浆罐、注浆泵、主管路、分配阀组、支管、盾尾注浆口",
    observation: "沿蓝色主管和黑色支管追踪浆液从泵站到盾尾的完整路径。",
    focusParts: ["mixingTank", "slurryTank", "groutPump", "mainPipeline", "valveGroup", "branchPipelines", "groutPorts"],
    timelineStepId: "pump",
    preset: "flow",
    component: "pipeline"
  },
  {
    id: "pressure",
    title: "第4步：注浆压力控制",
    description: "注浆压力不能过小，也不能过大。压力过小会填充不足，压力过大可能造成地层隆起、浆液外漏或管片上浮。",
    narration: "注浆压力不能过小，也不能过大。压力过小会造成填充不足和地表沉降；压力过大可能造成地层隆起、浆液外漏或管片上浮。",
    focus: "注浆泵、压力表、流量计、盾尾注浆管路、浆液填充层",
    observation: "观察压力表、流量计和浆液填充层的联动，理解压力控制边界。",
    focusParts: ["groutPump", "pressureGauge", "flowMeter", "mainPipeline", "groutLayer"],
    timelineStepId: "pump",
    preset: "pump",
    component: "pressureGauge"
  },
  {
    id: "feedback",
    title: "第5步：监测反馈调整",
    description: "施工中要结合注浆量、注浆压力、推进速度、地表沉降和管片姿态进行动态调整，形成监测反馈闭环。",
    narration: "施工中需要结合注浆量、注浆压力、盾构推进速度、地表沉降和管片姿态等数据进行动态调整，形成监测反馈闭环。",
    focus: "监测面板、沉降曲线、注浆量、注浆压力、盾构推进速度",
    observation: "观察右侧参数面板和底部仪表盘，理解监测数据如何反馈到施工调参。",
    focusParts: ["controlCabinet", "pressureGauge", "flowMeter"],
    timelineStepId: "adjust",
    preset: "overview",
    component: "controlCabinet"
  },
  {
    id: "stable",
    title: "第6步：质量稳定",
    description: "当浆液连续、均匀、及时地填充建筑空隙时，可以有效控制地层沉降，稳定管片结构，提高隧道成型质量。",
    narration: "当浆液能够连续、均匀、及时地填充建筑空隙时，可以有效控制地层沉降，稳定管片结构，提高隧道成型质量。",
    focus: "连续浆液填充层、稳定地层、成型管片环",
    observation: "观察连续浆液层包裹管片外侧后，地层和管片环进入稳定状态。",
    focusParts: ["groutLayer", "soilLayer", "segmentRing"],
    timelineStepId: "settlement",
    preset: "gap",
    component: "groutLayer"
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "Q1：同步注浆主要填充哪个位置？",
    answer: "主要填充盾尾脱出后形成的管片外侧建筑空隙，也就是管片外缘与地层之间的环形空隙。"
  },
  {
    id: "q2",
    question: "Q2：注浆压力是否越大越好？为什么？",
    answer: "不是。压力过低会填充不足，压力过高会引起地层隆起、浆液外漏或管片上浮，需要与流量、注浆量和沉降监测匹配。"
  },
  {
    id: "q3",
    question: "Q3：施工中需要重点监测哪些参数？",
    answer: "重点监测注浆压力、流量、每环注浆量、盾构推进速度、地表沉降，同时关注管片姿态和盾尾密封状态。"
  }
];
