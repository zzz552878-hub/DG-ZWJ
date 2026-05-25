import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { ExplodedViewControls } from "./components/ExplodedViewControls";
import { InfoPanel } from "./components/InfoPanel";
import { OperationTimeline } from "./components/OperationTimeline";
import { ParameterPanel } from "./components/ParameterPanel";
import { ProjectInfoModal } from "./components/ProjectInfoModal";
import { SceneErrorBoundary } from "./components/SceneErrorBoundary";
import { TeachingMode } from "./components/TeachingMode";
import { TopBar } from "./components/TopBar";
import { componentInfo, defaultSelectedComponent } from "./data/components";
import { getOperationStage, operationStages } from "./data/operationStages";
import { quizQuestions, teachingSteps } from "./data/teaching";
import { timelineSteps } from "./data/timeline";
import { useNarration } from "./hooks/useNarration";
import type { CameraMode, CameraPreset, ComponentId, OpacitySettings, Parameters, PartId, RiskMode, TimelineStep, ViewMode } from "./types";
import { classifyRisk, defaultParameters, riskPresets } from "./utils/engineering";

const GroutingScene = lazy(() =>
  import("./components/GroutingScene").then((module) => ({ default: module.GroutingScene }))
);

const defaultOpacity: OpacitySettings = {
  shield: 0.86,
  segment: 0.92,
  soil: 0.46,
  grout: 0.58
};

const componentParts: Partial<Record<ComponentId, PartId[]>> = {
  annularGap: ["segmentGap"],
  controlCabinet: ["controlCabinet"],
  flowMeter: ["flowMeter"],
  groutLayer: ["groutLayer"],
  groutPump: ["groutPump"],
  injectionPort: ["groutPorts"],
  mixingTank: ["mixingTank"],
  pipeline: ["mainPipeline", "branchPipelines"],
  pressureGauge: ["pressureGauge"],
  segmentRing: ["segmentRing"],
  shieldShell: ["shieldTail"],
  shieldTail: ["shieldTail"],
  soilLayer: ["soilLayer"],
  storageTank: ["slurryTank"],
  tailBrush: ["tailBrush"],
  valve: ["valveGroup"]
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("overall");
  const [selected, setSelected] = useState<ComponentId>(defaultSelectedComponent);
  const [parameters, setParameters] = useState<Parameters>(defaultParameters);
  const [opacity, setOpacity] = useState<OpacitySettings>(defaultOpacity);
  const [riskMode, setRiskMode] = useState<RiskMode>("normal");
  const [explosion, setExplosion] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>("free");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("overview");
  const [resetSignal, setResetSignal] = useState(0);
  const [activeStepId, setActiveStepId] = useState(timelineSteps[0].id);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [teachingMode, setTeachingMode] = useState(false);
  const [teachingIndex, setTeachingIndex] = useState(0);
  const [isNarrating, setIsNarrating] = useState(false);
  const [teachingCompleted, setTeachingCompleted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [projectInfoOpen, setProjectInfoOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightedParts, setHighlightedParts] = useState<PartId[]>([]);
  const [operationProgress, setOperationProgress] = useState(0);
  const [operationPlayMode, setOperationPlayMode] = useState<"auto" | "continuous">("auto");
  const [operationPaused, setOperationPaused] = useState(false);
  const teachingRunRef = useRef(0);
  const operationRunRef = useRef(0);
  const operationRangeRef = useRef<{ start: number; end: number } | null>(null);
  const lastContinuousSpeechRef = useRef("");
  const operationPausedRef = useRef(false);
  const autoCameraEnabledRef = useRef(true);
  const narration = useNarration();
  const {
    supported: narrationSupported,
    speak,
    pause,
    resume,
    stop,
    setRate,
    setVolume,
    rate,
    volume,
    isSpeaking,
    isPaused,
    errorMessage
  } = narration;

  const activeStep = useMemo(
    () => timelineSteps.find((step) => step.id === activeStepId) ?? timelineSteps[0],
    [activeStepId]
  );
  const risk = useMemo(() => classifyRisk(parameters, riskMode), [parameters, riskMode]);
  const activeOperationStage = useMemo(() => getOperationStage(operationProgress), [operationProgress]);
  const activeTeachingStep = teachingMode ? teachingSteps[teachingIndex] : null;
  const visibleOperationStage = viewMode === "operation" || isPlaying ? activeOperationStage : null;

  const moveCameraToPreset = useCallback((preset: CameraPreset, mode: CameraMode = "preset") => {
    setCameraPreset(preset);
    setCameraMode(mode);
  }, []);

  const handleUserCameraStart = useCallback(() => {
    autoCameraEnabledRef.current = false;
    setCameraMode("free");
  }, []);

  const applyOperationStage = useCallback(
    (stage = activeOperationStage, cameraModeForStage: CameraMode = "tour") => {
      setViewMode("operation");
      setSelected(stage.component);
      setActiveStepId(stage.timelineStepId);
      setHighlightedParts(stage.focusParts);
      if (autoCameraEnabledRef.current) {
        moveCameraToPreset(stage.preset, cameraModeForStage);
      }
    },
    [activeOperationStage, moveCameraToPreset]
  );

  const applyTeachingStep = useCallback(
    (index: number) => {
      const safeIndex = Math.min(Math.max(index, 0), teachingSteps.length - 1);
      const step = teachingSteps[safeIndex];
      autoCameraEnabledRef.current = true;
      setTeachingIndex(safeIndex);
      setTeachingCompleted(false);
      setSelected(step.component);
      setHighlightedParts(step.focusParts);
      setActiveStepId(step.timelineStepId);
      moveCameraToPreset(step.preset, "teaching");
      setViewMode(safeIndex === 0 ? "cutaway" : "operation");
      return { safeIndex, step };
    },
    [moveCameraToPreset]
  );

  const stopOperation = useCallback(
    (reset = false) => {
      operationRunRef.current += 1;
      operationRangeRef.current = null;
      setIsPlaying(false);
      setOperationPaused(false);
      if (reset) setOperationProgress(0);
      stop();
    },
    [stop]
  );

  const stopTeachingNarration = useCallback(() => {
    teachingRunRef.current += 1;
    setIsNarrating(false);
    stop();
  }, [stop]);

  const startOperation = useCallback(async () => {
    teachingRunRef.current += 1;
    setIsNarrating(false);
    setTeachingMode(false);
    stop();
    const runId = operationRunRef.current + 1;
    operationRunRef.current = runId;
    setViewMode("operation");
    setIsPlaying(true);
    setOperationPaused(false);
    autoCameraEnabledRef.current = true;

    if (operationPlayMode === "continuous") {
      const startProgress = operationProgress >= 0.99 ? 0 : operationProgress;
      setOperationProgress(startProgress);
      applyOperationStage(getOperationStage(startProgress), "tour");
      lastContinuousSpeechRef.current = "";
      return;
    }

    for (let index = 0; index < operationStages.length; index += 1) {
      if (operationRunRef.current !== runId) return;
      const stage = operationStages[index];
      operationRangeRef.current = { start: stage.start, end: stage.end };
      setOperationProgress(stage.start);
      applyOperationStage(stage, "tour");

      if (voiceEnabled) {
        await speak(stage.narration, { stepIndex: index });
      }
      if (operationRunRef.current !== runId) return;
      setOperationProgress(stage.end);
      await delay(500);
    }

    if (operationRunRef.current === runId) {
      operationRangeRef.current = null;
      setIsPlaying(false);
      setOperationPaused(false);
      setCameraMode("free");
    }
  }, [applyOperationStage, operationPlayMode, operationProgress, speak, stop, voiceEnabled]);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (mode !== "operation") {
        stopOperation(false);
        stopTeachingNarration();
      }
      setViewMode(mode);
      if (mode === "exploded") {
        setExplosion((value) => (value > 0 ? value : 0.72));
      }
      if (mode === "cutaway") {
        setSelected("annularGap");
        setHighlightedParts(["segmentGap"]);
      }
      if (mode === "operation") {
        void startOperation();
      }
    },
    [startOperation, stopOperation, stopTeachingNarration]
  );

  const handleParameterChange = useCallback((key: keyof Parameters, value: number) => {
    setParameters((current) => ({ ...current, [key]: value }));
  }, []);

  const handleOpacityChange = useCallback((key: keyof OpacitySettings, value: number) => {
    setOpacity((current) => ({ ...current, [key]: value }));
  }, []);

  const handleRiskModeChange = useCallback((mode: RiskMode) => {
    setRiskMode(mode);
    setParameters(riskPresets[mode]);
  }, []);

  const handleTimelineClick = useCallback((step: TimelineStep) => {
    stopTeachingNarration();
    autoCameraEnabledRef.current = true;
    setActiveStepId(step.id);
    setViewMode(step.id === "settlement" ? "cutaway" : "operation");
    const stage = operationStages.find((item) => item.timelineStepId === step.id);
    if (stage) {
      setOperationProgress(stage.start);
      applyOperationStage(stage, "preset");
    }
    if (step.phase === "tailInjection") setSelected("injectionPort");
    if (step.phase === "gapFill") setSelected("groutLayer");
    if (step.phase === "pumping") setSelected("groutPump");
  }, [applyOperationStage, stopTeachingNarration]);

  const resetCamera = useCallback(() => {
    autoCameraEnabledRef.current = true;
    moveCameraToPreset("overview", "preset");
    setResetSignal((value) => value + 1);
  }, [moveCameraToPreset]);

  const resetAnimation = useCallback(() => {
    stopOperation(true);
    operationRangeRef.current = null;
    setActiveStepId(timelineSteps[0].id);
    setSelected(defaultSelectedComponent);
    setHighlightedParts([]);
  }, [stopOperation]);

  const exportCurrentView = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(".scene-shell canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `盾构同步注浆三维视图-${Date.now()}.png`;
    link.click();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
      return;
    }
    document.exitFullscreen().catch(() => undefined);
  }, []);

  const handleTeachingToggle = useCallback(() => {
    setTeachingMode((enabled) => {
      const next = !enabled;
      if (next) {
        stopOperation(false);
        applyTeachingStep(0);
      } else {
        stopTeachingNarration();
        setTeachingCompleted(false);
        setHighlightedParts([]);
      }
      return next;
    });
  }, [applyTeachingStep, stopOperation, stopTeachingNarration]);

  const handleTeachingStepChange = useCallback(
    (index: number) => {
      stopTeachingNarration();
      const { safeIndex, step } = applyTeachingStep(index);
      if (voiceEnabled) {
        void speak(step.narration, { stepIndex: safeIndex });
      }
    },
    [applyTeachingStep, speak, stopTeachingNarration, voiceEnabled]
  );

  const speakTeachingStep = useCallback(
    (index = teachingIndex) => {
      const step = teachingSteps[index];
      return speak(step?.narration ?? step?.description ?? "", { stepIndex: index });
    },
    [speak, teachingIndex]
  );

  useEffect(() => {
    operationPausedRef.current = operationPaused;
  }, [operationPaused]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = (time: number) => {
      const delta = time - last;
      last = time;
      if (!operationPausedRef.current) {
        setOperationProgress((current) => {
          if (operationPlayMode === "auto" && operationRangeRef.current) {
            const range = operationRangeRef.current;
            const next = current + (delta / 6500) * (range.end - range.start);
            return Math.min(range.end, Math.max(range.start, next));
          }
          if (operationPlayMode === "continuous") {
            return Math.min(1, current + delta / 52000);
          }
          return current;
        });
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [isPlaying, operationPlayMode]);

  useEffect(() => {
    if (!isPlaying || operationPlayMode !== "continuous") return;
    applyOperationStage(activeOperationStage, cameraMode === "free" ? "preset" : "tour");
    if (voiceEnabled && lastContinuousSpeechRef.current !== activeOperationStage.id) {
      lastContinuousSpeechRef.current = activeOperationStage.id;
      void speak(activeOperationStage.narration);
    }
    if (operationProgress >= 1) {
      setIsPlaying(false);
      setOperationPaused(false);
      setCameraMode("free");
    }
  }, [activeOperationStage, applyOperationStage, cameraMode, isPlaying, operationPlayMode, operationProgress, speak, voiceEnabled]);

  const startTeachingNarration = useCallback(async () => {
    stopOperation(false);
    stop();
    const runId = teachingRunRef.current + 1;
    teachingRunRef.current = runId;
    setTeachingMode(true);
    setIsNarrating(true);
    setTeachingCompleted(false);

    for (let index = 0; index < teachingSteps.length; index += 1) {
      if (teachingRunRef.current !== runId) return;
      const { step } = applyTeachingStep(index);
      if (voiceEnabled) {
        await speak(step.narration, { stepIndex: index });
      }
      if (teachingRunRef.current !== runId) return;
      await delay(500);
    }

    if (teachingRunRef.current === runId) {
      setIsNarrating(false);
      setTeachingCompleted(true);
      setCameraMode("free");
    }
  }, [applyTeachingStep, speak, stop, stopOperation, voiceEnabled]);

  const handleOperationProgressChange = useCallback(
    (value: number) => {
      if (isPlaying && operationPlayMode === "auto") {
        stopOperation(false);
      }
      operationRangeRef.current = null;
      setOperationProgress(value);
    const stage = getOperationStage(value);
    autoCameraEnabledRef.current = true;
    applyOperationStage(stage, "preset");
      if (isPlaying && operationPlayMode === "continuous" && voiceEnabled) {
        stop();
        lastContinuousSpeechRef.current = "";
      }
    },
    [applyOperationStage, isPlaying, operationPlayMode, stop, stopOperation, voiceEnabled]
  );

  const handleOperationPlayToggle = useCallback(() => {
    if (!isPlaying) {
      void startOperation();
      return;
    }
    if (operationPaused) {
      setOperationPaused(false);
      resume();
      return;
    }
    setOperationPaused(true);
    pause();
  }, [isPlaying, operationPaused, pause, resume, startOperation]);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const status = `${activeStep.message} 当前判断：${risk.status}`;

  return (
    <div className={`app-shell risk-${risk.mode} ${timelineCollapsed ? "timeline-collapsed" : ""}`}>
      <TopBar
        viewMode={viewMode}
        teachingMode={teachingMode}
        onViewModeChange={handleViewModeChange}
        onTeachingModeToggle={handleTeachingToggle}
        onResetCamera={resetCamera}
        onExportImage={exportCurrentView}
        onProjectInfoOpen={() => setProjectInfoOpen(true)}
        onFullscreenToggle={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <main className="workspace">
        <section className="viewer-panel">
          <SceneErrorBoundary>
            <Suspense
              fallback={
                <div className="viewer-loading">
                  <span />
                  <strong>模型加载中，请稍候……</strong>
                  <p>正在准备盾尾、管片、管路和监测仪表</p>
                </div>
              }
            >
              <GroutingScene
                selected={selected}
                viewMode={viewMode}
                explosion={explosion}
                cameraMode={cameraMode}
                cameraPreset={cameraPreset}
                resetSignal={resetSignal}
                opacity={opacity}
                parameters={parameters}
                riskMode={risk.mode}
                isPlaying={isPlaying}
                activePhase={visibleOperationStage?.phase ?? activeStep.phase}
                highlightedParts={highlightedParts}
                operationProgress={operationProgress}
                onSelect={(id) => {
                  setSelected(id);
                  if (!isPlaying && !isNarrating) {
                    setHighlightedParts(componentParts[id] ?? []);
                  }
                }}
                onCameraModeChange={setCameraMode}
                onUserCameraStart={handleUserCameraStart}
              />
            </Suspense>
          </SceneErrorBoundary>
          <div className="interaction-hint" aria-label="三维交互提示">
            左键旋转 · 滚轮缩放 · 右键平移 · 点击部件查看说明
          </div>
          <ExplodedViewControls
            viewMode={viewMode}
            explosion={explosion}
            isPlaying={isPlaying}
            operationPaused={operationPaused}
            operationProgress={operationProgress}
            operationPlayMode={operationPlayMode}
            activeOperationLabel={activeOperationStage.label}
            activePreset={cameraPreset}
            opacity={opacity}
            onExplosionChange={setExplosion}
            onPlayToggle={handleOperationPlayToggle}
            onResetAnimation={resetAnimation}
            onOperationProgressChange={handleOperationProgressChange}
            onOperationPlayModeChange={setOperationPlayMode}
            onPresetChange={(preset) => {
              autoCameraEnabledRef.current = true;
              moveCameraToPreset(preset, "preset");
            }}
            onOpacityChange={handleOpacityChange}
          />
          <TeachingMode
            enabled={teachingMode}
            autoNarrationPlaying={isNarrating}
            voiceEnabled={voiceEnabled}
            voiceSupported={narrationSupported}
            rate={rate}
            volume={volume}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            completed={teachingCompleted}
            errorMessage={errorMessage}
            steps={teachingSteps}
            questions={quizQuestions}
            activeIndex={teachingIndex}
            onStepChange={handleTeachingStepChange}
            onStartNarration={() => void startTeachingNarration()}
            onStopNarration={stopTeachingNarration}
            onVoiceEnabledChange={(enabled) => {
              setVoiceEnabled(enabled);
              if (!enabled) stop();
              if (enabled && teachingMode) speakTeachingStep();
            }}
            onSpeakCurrent={() => speakTeachingStep()}
            onPauseSpeech={pause}
            onResumeSpeech={resume}
            onStopSpeech={() => {
              stopTeachingNarration();
              stop();
            }}
            onRateChange={setRate}
            onVolumeChange={setVolume}
          />
        </section>

        <aside className="right-rail">
          <InfoPanel component={componentInfo[selected]} teachingStep={activeTeachingStep} operationStage={visibleOperationStage} risk={risk} />
          <ParameterPanel
            parameters={parameters}
            opacity={opacity}
            riskMode={riskMode}
            onParameterChange={handleParameterChange}
            onOpacityChange={handleOpacityChange}
            onRiskModeChange={handleRiskModeChange}
          />
        </aside>
      </main>

      <section className="lower-dock">
        <OperationTimeline
          steps={timelineSteps}
          activeStepId={activeStepId}
          status={status}
          collapsed={timelineCollapsed}
          onCollapsedChange={setTimelineCollapsed}
          onStepClick={handleTimelineClick}
        />
        <Dashboard parameters={parameters} riskMode={risk.mode} />
      </section>
      <ProjectInfoModal open={projectInfoOpen} onClose={() => setProjectInfoOpen(false)} />
    </div>
  );
}
