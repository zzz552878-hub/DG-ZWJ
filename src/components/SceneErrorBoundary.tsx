import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface SceneErrorBoundaryProps {
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class SceneErrorBoundary extends Component<SceneErrorBoundaryProps, SceneErrorBoundaryState> {
  state: SceneErrorBoundaryState = {
    hasError: false,
    message: ""
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "模型或纹理加载失败"
    };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="scene-error">
        <AlertTriangle size={32} />
        <strong>模型加载失败，但页面仍可继续使用</strong>
        <p>{this.state.message}</p>
        <span>请检查 public/models 中的 GLB 文件路径和文件格式，缺失模型会自动使用程序化示意模型。</span>
      </div>
    );
  }
}
