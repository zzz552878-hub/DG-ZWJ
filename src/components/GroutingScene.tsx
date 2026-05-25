import { ContactShadows, Html, OrbitControls, Preload, Text, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import type {
  CameraMode,
  CameraPreset,
  ComponentId,
  OpacitySettings,
  OperationPhase,
  Parameters,
  PartId,
  RiskMode,
  ViewMode
} from "../types";
import { EngineeringFloor } from "./EngineeringPrimitives";
import { GroutingSystemModel } from "./GroutingSystemModel";
import { TBMModel } from "./TBMModel";

interface GroutingSceneProps {
  selected: ComponentId;
  viewMode: ViewMode;
  explosion: number;
  cameraMode: CameraMode;
  cameraPreset: CameraPreset;
  resetSignal: number;
  opacity: OpacitySettings;
  parameters: Parameters;
  riskMode: RiskMode;
  isPlaying: boolean;
  activePhase: OperationPhase;
  highlightedParts: PartId[];
  operationProgress: number;
  onSelect: (id: ComponentId) => void;
  onCameraModeChange: (mode: CameraMode) => void;
  onUserCameraStart: () => void;
}

const cameraPresets: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  overview: { position: [4.95, 3.15, 5.35], target: [1.18, -0.06, -0.26] },
  tail: { position: [2.35, 2.95, 4.55], target: [0.94, 0.08, 0.08] },
  pump: { position: [-1.75, 1.02, -1.78], target: [-1.55, -1.38, -4.08] },
  gap: { position: [4.65, 1.86, 2.86], target: [2.35, 0.02, 0.05] },
  flow: { position: [2.35, 3.25, -6.45], target: [-0.15, -0.72, -3.18] }
};

const phaseLabels: Record<OperationPhase, string> = {
  material: "材料配制",
  mixing: "搅拌制浆",
  storage: "储浆",
  pumping: "注浆泵送",
  pipeline: "管路输送",
  tailInjection: "盾尾多点注入",
  gapFill: "空隙填充",
  stabilize: "地层稳定"
};

const highlightAnchors: Partial<Record<PartId, { label: string; position: [number, number, number] }>> = {
  rawMaterials: { label: "原材料进料", position: [-4.8, -0.52, -4.08] },
  mixingTank: { label: "搅拌罐", position: [-4.35, 0.25, -4.08] },
  mixingMotor: { label: "搅拌电机", position: [-4.35, -0.25, -4.08] },
  mixingShaft: { label: "搅拌轴 / 叶片", position: [-4.35, -1.18, -4.08] },
  slurryTank: { label: "储浆罐", position: [-2.72, 0.2, -4.08] },
  groutPump: { label: "注浆泵", position: [-1.05, -0.72, -4.04] },
  pressureGauge: { label: "压力表", position: [-0.08, -0.52, -3.78] },
  flowMeter: { label: "流量计", position: [-0.32, -0.72, -3.86] },
  mainPipeline: { label: "输浆主管", position: [-0.18, -0.68, -3.72] },
  valveGroup: { label: "分配阀组", position: [0.24, -0.52, -3.5] },
  branchPipelines: { label: "注浆支管", position: [0.72, 1.42, -1.22] },
  shieldTail: { label: "盾尾", position: [0.74, 2.32, -0.65] },
  tailBrush: { label: "盾尾刷", position: [0.6, 2.16, 0.78] },
  groutPorts: { label: "盾尾注浆口", position: [0.94, 2.18, 1] },
  segmentRing: { label: "管片环", position: [2.18, -2.05, 0.85] },
  segmentGap: { label: "建筑空隙", position: [2.38, 2.48, 0.6] },
  groutLayer: { label: "浆液填充层", position: [2.58, -1.72, 1.45] },
  soilLayer: { label: "地层剖面", position: [2.9, 3.1, -0.78] },
  controlCabinet: { label: "控制柜", position: [-0.08, -0.68, -4.82] }
};

function HighlightOverlay({ parts }: { parts: PartId[] }) {
  return (
    <group>
      {parts.map((part) => {
        const anchor = highlightAnchors[part];
        if (!anchor) return null;
        return (
          <group key={part} position={anchor.position}>
            <pointLight intensity={0.38} distance={1.2} color="#ffd36b" />
            <mesh>
              <sphereGeometry args={[0.075, 18, 12]} />
              <meshStandardMaterial color="#ffd36b" emissive="#ffd36b" emissiveIntensity={0.9} opacity={0.72} transparent />
            </mesh>
            <Html center distanceFactor={9} position={[0, 0.24, 0]}>
              <div className="part-highlight-label">{anchor.label}</div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function CameraController({
  mode,
  preset,
  resetSignal,
  controlsRef,
  onComplete
}: {
  mode: CameraMode;
  preset: CameraPreset;
  resetSignal: number;
  controlsRef: React.MutableRefObject<any>;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(...cameraPresets[preset].position));
  const targetLookAt = useRef(new THREE.Vector3(...cameraPresets[preset].target));
  const isAnimating = useRef(false);
  const didSetInitialTarget = useRef(false);

  useEffect(() => {
    if (!controlsRef.current || didSetInitialTarget.current) return;
    controlsRef.current.target.set(...cameraPresets.overview.target);
    controlsRef.current.update();
    didSetInitialTarget.current = true;
  }, [controlsRef]);

  useEffect(() => {
    if (mode === "free") {
      isAnimating.current = false;
      return;
    }
    const next = cameraPresets[preset];
    targetPosition.current.set(...next.position);
    targetLookAt.current.set(...next.target);
    isAnimating.current = true;
  }, [mode, preset, resetSignal]);

  useFrame((_, delta) => {
    if (mode === "free" || !isAnimating.current) return;
    const alpha = Math.min(1, delta * 3.6);
    camera.position.lerp(targetPosition.current, alpha);
    if (controlsRef.current?.target) {
      controlsRef.current.target.lerp(targetLookAt.current, alpha);
      controlsRef.current.update();
    }

    const positionDone = camera.position.distanceTo(targetPosition.current) < 0.035;
    const targetDone = controlsRef.current?.target
      ? controlsRef.current.target.distanceTo(targetLookAt.current) < 0.035
      : true;

    if (positionDone && targetDone) {
      camera.position.copy(targetPosition.current);
      if (controlsRef.current?.target) {
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
      }
      isAnimating.current = false;
      if (mode !== "tour") {
        onComplete();
      }
    }
  });

  return null;
}

function LoadingFallback() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="scene-loader">
        <span />
        <strong>模型加载中，请稍候……</strong>
        <p>模型、材质、粒子与监测面板初始化中</p>
        <div className="loader-track">
          <i style={{ width: `${Math.max(8, Math.round(progress))}%` }} />
        </div>
        <em>{Math.round(progress)}%</em>
      </div>
    </Html>
  );
}

function SceneContent(props: GroutingSceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const currentViewRef = useRef({
    position: camera.position.clone(),
    target: new THREE.Vector3(...cameraPresets.overview.target)
  });
  const operationOn = props.viewMode === "operation" || props.isPlaying;
  const rememberCurrentView = useCallback(() => {
    currentViewRef.current.position.copy(camera.position);
    if (controlsRef.current?.target) {
      currentViewRef.current.target.copy(controlsRef.current.target);
    }
  }, [camera]);

  return (
    <>
      <color attach="background" args={["#071827"]} />
      <fog attach="fog" args={["#071827", 9, 18]} />
      <CameraController
        mode={props.cameraMode}
        preset={props.cameraPreset}
        resetSignal={props.resetSignal}
        controlsRef={controlsRef}
        onComplete={() => props.onCameraModeChange("free")}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableRotate
        enableZoom
        enablePan
        enableDamping
        dampingFactor={0.05}
        minDistance={3.4}
        maxDistance={15}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        onStart={props.onUserCameraStart}
        onChange={rememberCurrentView}
        onEnd={rememberCurrentView}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
      />

      <ambientLight intensity={0.45} />
      <hemisphereLight args={["#dff6ff", "#23313a", 1.25]} />
      <directionalLight castShadow position={[5.5, 7, 4.2]} intensity={2.15} shadow-mapSize={[2048, 2048]} />
      <spotLight position={[-3.8, 4.7, -4.9]} angle={0.45} penumbra={0.45} intensity={2.4} color="#89e4ff" castShadow />
      <pointLight position={[0.7, 2.4, -2.8]} intensity={operationOn ? 2.1 : 0.65} color="#69e1ff" />
      <pointLight position={[2.6, 1.1, 1.8]} intensity={props.riskMode === "high" ? 2.4 : 0.55} color="#ffd36b" />

      <EngineeringFloor />
      <group onPointerMissed={() => props.onSelect("annularGap")}>
        <TBMModel
          selected={props.selected}
          explosion={props.viewMode === "exploded" ? props.explosion : props.explosion * 0.12}
          viewMode={props.viewMode}
          opacity={props.opacity}
          parameters={props.parameters}
              riskMode={props.riskMode}
              isPlaying={operationOn}
              highlightedParts={props.highlightedParts}
              operationProgress={props.operationProgress}
              onSelect={props.onSelect}
            />
        <GroutingSystemModel
          selected={props.selected}
          explosion={props.viewMode === "exploded" ? props.explosion : props.explosion * 0.08}
          parameters={props.parameters}
          riskMode={props.riskMode}
          isPlaying={operationOn}
          highlightedParts={props.highlightedParts}
          operationProgress={props.operationProgress}
          onSelect={props.onSelect}
        />
      </group>
      <HighlightOverlay parts={props.highlightedParts} />

      <Text position={[-0.2, 3.1, -2.9]} fontSize={0.18} color="#dff8ff" anchorX="center" maxWidth={4.5}>
        {phaseLabels[props.activePhase]} · 边推进 / 边拼装 / 边注浆 / 边稳定
      </Text>
      <Text position={[2.7, -2.25, 1.9]} fontSize={0.12} color="#ffd36b" anchorX="center">
        北京地铁盾构施工同步注浆数字孪生示意
      </Text>
      <ContactShadows opacity={0.36} scale={12} blur={2.4} far={4.8} position={[0, -2.48, 0]} />
      <Preload all />
    </>
  );
}

export function GroutingScene(props: GroutingSceneProps) {
  return (
    <div className="scene-shell">
      <Canvas
        shadows
        dpr={[1, 1.7]}
        camera={{ position: cameraPresets.overview.position, fov: 45, near: 0.1, far: 120 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <SceneContent {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
