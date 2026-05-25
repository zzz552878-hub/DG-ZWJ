import { ChevronRight, Pause, Play, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { CameraPreset, OpacitySettings, ViewMode } from "../types";

interface ExplodedViewControlsProps {
  viewMode: ViewMode;
  explosion: number;
  isPlaying: boolean;
  operationPaused: boolean;
  operationProgress: number;
  operationPlayMode: "auto" | "continuous";
  activeOperationLabel: string;
  activePreset: CameraPreset;
  opacity: OpacitySettings;
  onExplosionChange: (value: number) => void;
  onPlayToggle: () => void;
  onResetAnimation: () => void;
  onOperationProgressChange: (value: number) => void;
  onOperationPlayModeChange: (mode: "auto" | "continuous") => void;
  onPresetChange: (preset: CameraPreset) => void;
  onOpacityChange: (key: keyof OpacitySettings, value: number) => void;
}

const presets: Array<{ id: CameraPreset; label: string }> = [
  { id: "overview", label: "全景" },
  { id: "tail", label: "盾尾" },
  { id: "pump", label: "注浆泵" },
  { id: "gap", label: "空隙剖面" },
  { id: "flow", label: "流动路径" }
];

const opacityRows: Array<{ key: keyof OpacitySettings; label: string }> = [
  { key: "shield", label: "盾体" },
  { key: "segment", label: "管片" },
  { key: "soil", label: "地层" },
  { key: "grout", label: "浆液层" }
];

export function ExplodedViewControls({
  viewMode,
  explosion,
  isPlaying,
  operationPaused,
  operationProgress,
  operationPlayMode,
  activeOperationLabel,
  activePreset,
  opacity,
  onExplosionChange,
  onPlayToggle,
  onResetAnimation,
  onOperationProgressChange,
  onOperationPlayModeChange,
  onPresetChange,
  onOpacityChange
}: ExplodedViewControlsProps) {
  return (
    <aside className="scene-controls">
      <div className="control-section compact">
        <div className="section-title">
          <SlidersHorizontal size={15} />
          <span>视角预设</span>
        </div>
        <div className="preset-grid">
          {presets.map((preset) => (
            <button
              className={activePreset === preset.id ? "preset-chip active" : "preset-chip"}
              key={preset.id}
              onClick={() => onPresetChange(preset.id)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <div className="section-title">
          <ChevronRight size={15} />
          <span>爆炸拆分</span>
          <strong>{Math.round(explosion * 100)}%</strong>
        </div>
        <input
          aria-label="爆炸程度"
          disabled={viewMode !== "exploded"}
          max={100}
          min={0}
          onChange={(event) => onExplosionChange(Number(event.target.value) / 100)}
          type="range"
          value={Math.round(explosion * 100)}
        />
      </div>

      <div className="control-section">
        <div className="section-title">
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span>运行原理</span>
          <strong>{Math.round(operationProgress * 100)}%</strong>
        </div>
        <div className="operation-stage-label">{activeOperationLabel}</div>
        <input
          aria-label="运行原理进度"
          max={100}
          min={0}
          onChange={(event) => onOperationProgressChange(Number(event.target.value) / 100)}
          type="range"
          value={Math.round(operationProgress * 100)}
        />
        <div className="mode-row">
          <button
            className={operationPlayMode === "auto" ? "mode-chip active" : "mode-chip"}
            onClick={() => onOperationPlayModeChange("auto")}
            type="button"
          >
            自动讲解
          </button>
          <button
            className={operationPlayMode === "continuous" ? "mode-chip active" : "mode-chip"}
            onClick={() => onOperationPlayModeChange("continuous")}
            type="button"
          >
            连续播放
          </button>
        </div>
        <div className="button-row">
          <button className="soft-button" onClick={onPlayToggle} type="button">
            {isPlaying && !operationPaused ? <Pause size={15} /> : <Play size={15} />}
            {!isPlaying ? "播放" : operationPaused ? "继续" : "暂停"}
          </button>
          <button className="soft-button" onClick={onResetAnimation} type="button">
            <RotateCcw size={15} />
            重置
          </button>
        </div>
      </div>

      <div className="control-section">
        <div className="section-title">
          <span>部件透明度</span>
        </div>
        {opacityRows.map((row) => (
          <label className="range-row" key={row.key}>
            <span>{row.label}</span>
            <input
              aria-label={`${row.label}透明度`}
              max={100}
              min={12}
              onChange={(event) => onOpacityChange(row.key, Number(event.target.value) / 100)}
              type="range"
              value={Math.round(opacity[row.key] * 100)}
            />
            <b>{Math.round(opacity[row.key] * 100)}%</b>
          </label>
        ))}
      </div>
    </aside>
  );
}
