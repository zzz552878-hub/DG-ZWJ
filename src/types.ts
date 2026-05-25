export type ViewMode = "overall" | "exploded" | "cutaway" | "operation";

export type CameraPreset = "overview" | "tail" | "pump" | "gap" | "flow";

export type CameraMode = "free" | "preset" | "teaching" | "tour";

export type PartId =
  | "mixingTank"
  | "mixingMotor"
  | "mixingShaft"
  | "slurryTank"
  | "groutPump"
  | "pressureGauge"
  | "flowMeter"
  | "mainPipeline"
  | "valveGroup"
  | "branchPipelines"
  | "shieldTail"
  | "tailBrush"
  | "groutPorts"
  | "segmentRing"
  | "segmentGap"
  | "groutLayer"
  | "soilLayer"
  | "controlCabinet"
  | "rawMaterials";

export type RiskMode = "normal" | "low" | "high";

export type OperationPhase =
  | "material"
  | "mixing"
  | "storage"
  | "pumping"
  | "pipeline"
  | "tailInjection"
  | "gapFill"
  | "stabilize";

export type ComponentId =
  | "shieldShell"
  | "shieldTail"
  | "tailBrush"
  | "segmentRing"
  | "annularGap"
  | "soilLayer"
  | "groutLayer"
  | "mixingTank"
  | "storageTank"
  | "groutPump"
  | "pipeline"
  | "valve"
  | "pressureGauge"
  | "flowMeter"
  | "controlCabinet"
  | "injectionPort";

export interface ComponentInfo {
  id: ComponentId;
  name: string;
  category: string;
  location?: string;
  role: string;
  caution: string;
  failure?: string;
  detail: string;
}

export interface Parameters {
  pressure: number;
  flow: number;
  volume: number;
  advanceSpeed: number;
  settlement: number;
}

export interface OpacitySettings {
  shield: number;
  segment: number;
  soil: number;
  grout: number;
}

export interface TimelineStep {
  id: string;
  index: number;
  label: string;
  phase: OperationPhase;
  preset: CameraPreset;
  message: string;
}

export interface TeachingStep {
  id: string;
  title: string;
  description: string;
  narration: string;
  focus: string;
  observation: string;
  focusParts: PartId[];
  timelineStepId: string;
  preset: CameraPreset;
  component: ComponentId;
}

export interface OperationStage {
  id: string;
  label: string;
  phase: OperationPhase;
  start: number;
  end: number;
  preset: CameraPreset;
  component: ComponentId;
  timelineStepId: string;
  focusParts: PartId[];
  description: string;
  narration: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answer: string;
}
