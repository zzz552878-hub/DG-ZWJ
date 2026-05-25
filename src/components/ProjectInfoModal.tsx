import { Info, MousePointer2, X } from "lucide-react";

interface ProjectInfoModalProps {
  open: boolean;
  onClose: () => void;
}

const hints = [
  "鼠标左键旋转视角",
  "滚轮缩放模型",
  "右键拖动平移",
  "点击部件查看说明",
  "点击爆炸视图查看系统结构"
];

export function ProjectInfoModal({ open, onClose }: ProjectInfoModalProps) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="project-modal" aria-modal="true" role="dialog" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" aria-label="关闭项目说明" onClick={onClose} type="button">
          <X size={18} />
        </button>
        <div className="modal-heading">
          <Info size={20} />
          <div>
            <span>项目说明</span>
            <h2>盾构同步注浆系统三维交互展示平台</h2>
          </div>
        </div>
        <p>
          本平台面向课堂汇报和工程展示，使用程序化工程教学示意模型表达盾尾、管片、同步注浆管路、泵站设备、浆液填充层和监测反馈逻辑。
          当前模型不对应具体厂家或型号，后续可替换真实 GLB / CAD 模型。
        </p>
        <div className="hint-card">
          <h3>
            <MousePointer2 size={17} />
            使用提示
          </h3>
          <div className="hint-grid">
            {hints.map((hint) => (
              <span key={hint}>{hint}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
