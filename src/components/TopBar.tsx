import {
  Box,
  Camera,
  Download,
  GraduationCap,
  Info,
  Layers3,
  Maximize2,
  Minimize2,
  PlayCircle,
  RotateCcw,
  ScanEye,
  SplitSquareHorizontal
} from "lucide-react";
import type { ViewMode } from "../types";

interface TopBarProps {
  viewMode: ViewMode;
  teachingMode: boolean;
  onViewModeChange: (mode: ViewMode) => void;
  onTeachingModeToggle: () => void;
  onResetCamera: () => void;
  onExportImage: () => void;
  onProjectInfoOpen: () => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

const viewButtons: Array<{ mode: ViewMode; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { mode: "overall", label: "整体视图", icon: Box },
  { mode: "exploded", label: "爆炸视图", icon: Layers3 },
  { mode: "cutaway", label: "剖切视图", icon: SplitSquareHorizontal },
  { mode: "operation", label: "运行演示", icon: PlayCircle }
];

export function TopBar({
  viewMode,
  teachingMode,
  onViewModeChange,
  onTeachingModeToggle,
  onResetCamera,
  onExportImage,
  onProjectInfoOpen,
  onFullscreenToggle,
  isFullscreen
}: TopBarProps) {
  const FullscreenIcon = isFullscreen ? Minimize2 : Maximize2;

  return (
    <header className="topbar">
      <div className="brand-block">
        <div className="brand-mark">
          <ScanEye size={28} />
        </div>
        <div className="brand-copy">
          <h1>盾构同步注浆系统三维交互展示平台</h1>
          <div className="brand-meta">
            <p>整体模型 · 爆炸展示 · 运行原理 · 参数监测</p>
            <span>制作人：机电3242 赵文杰</span>
          </div>
        </div>
      </div>

      <nav className="top-actions" aria-label="主操作">
        <button className="action-button info-action" onClick={onProjectInfoOpen} type="button">
          <Info size={17} />
          <span>项目说明</span>
        </button>
        {viewButtons.map((button) => {
          const Icon = button.icon;
          return (
            <button
              key={button.mode}
              aria-label={button.label}
              className={viewMode === button.mode ? "action-button active" : "action-button"}
              onClick={() => onViewModeChange(button.mode)}
              type="button"
            >
              <Icon size={17} />
              <span>{button.label}</span>
            </button>
          );
        })}
        <button
          aria-label="教学模式"
          className={teachingMode ? "action-button active" : "action-button"}
          onClick={onTeachingModeToggle}
          type="button"
        >
          <GraduationCap size={17} />
          <span>教学模式</span>
        </button>
        <button className="icon-button" onClick={onResetCamera} title="重置视角" type="button">
          <RotateCcw size={18} />
        </button>
        <button className="icon-button" onClick={onFullscreenToggle} title={isFullscreen ? "退出全屏" : "全屏展示"} type="button">
          <FullscreenIcon size={18} />
        </button>
        <button className="icon-button" onClick={onExportImage} title="导出当前视图" type="button">
          <Download size={18} />
        </button>
        <button className="icon-button camera-dot" title="相机预设在三维视窗左上角" type="button">
          <Camera size={18} />
        </button>
      </nav>
    </header>
  );
}
