import { AlertTriangle, CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import type { ComponentInfo, OperationStage, TeachingStep } from "../types";

interface InfoPanelProps {
  component: ComponentInfo;
  teachingStep?: TeachingStep | null;
  operationStage?: OperationStage | null;
  risk: {
    label: string;
    tone: string;
    status: string;
    hints: string[];
    description: string;
  };
}

export function InfoPanel({ component, teachingStep, operationStage, risk }: InfoPanelProps) {
  return (
    <section className="panel-stack">
      {teachingStep ? (
        <article className="glass-panel guide-card">
          <div className="panel-kicker">教学讲解</div>
          <h2>{teachingStep.title}</h2>
          <p>{teachingStep.narration}</p>
          <dl>
            <div>
              <dt>重点部件</dt>
              <dd>{teachingStep.focus}</dd>
            </div>
            <div>
              <dt>观察提示</dt>
              <dd>{teachingStep.observation}</dd>
            </div>
          </dl>
        </article>
      ) : null}

      {operationStage ? (
        <article className="glass-panel guide-card operation-guide">
          <div className="panel-kicker">运行原理阶段</div>
          <h2>{operationStage.label}</h2>
          <p>{operationStage.description}</p>
          <dl>
            <div>
              <dt>进度范围</dt>
              <dd>
                {Math.round(operationStage.start * 100)}% - {Math.round(operationStage.end * 100)}%
              </dd>
            </div>
            <div>
              <dt>讲解文案</dt>
              <dd>{operationStage.narration}</dd>
            </div>
          </dl>
        </article>
      ) : null}

      <article className="glass-panel component-card">
        <div className="panel-kicker">{component.category}</div>
        <h2>{component.name}</h2>
        <dl>
          <div>
            <dt>所在位置</dt>
            <dd>{component.location ?? "工程结构示意位置，后续可结合真实图纸或 GLB 模型校准。"}</dd>
          </div>
          <div>
            <dt>作用</dt>
            <dd>{component.role}</dd>
          </div>
          <div>
            <dt>施工注意点</dt>
            <dd>{component.caution}</dd>
          </div>
          <div>
            <dt>常见故障</dt>
            <dd>{component.failure ?? "参数异常、连接松动、磨损或堵塞时，需要结合现场监测进行复核。"}</dd>
          </div>
          <div>
            <dt>模型说明</dt>
            <dd>{component.detail}</dd>
          </div>
        </dl>
      </article>

      <article className={`glass-panel risk-card ${risk.tone}`}>
        <div className="risk-heading">
          {risk.tone === "stable" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <div>
            <span>{risk.label}</span>
            <strong>{risk.status}</strong>
          </div>
        </div>
        <p>{risk.description}</p>
        <div className="risk-tags">
          {risk.hints.map((hint) => (
            <span key={hint}>{hint}</span>
          ))}
        </div>
      </article>

      <article className="glass-panel engineering-card">
        <h3>
          <ClipboardList size={18} />
          真实工程说明
        </h3>
        <p>
          <strong>系统作用：</strong>填充盾尾空隙、控制地层沉降、稳定管片结构。
        </p>
        <p>
          <strong>关键控制：</strong>注浆量、注浆压力、浆液性能、注浆时机。
        </p>
        <p>
          <strong>常见问题：</strong>注浆不足、压力异常、浆液外漏、管片上浮。
        </p>
        <p>
          <strong>处理措施：</strong>检查管路、调整压力、优化配比、加强监测。
        </p>
      </article>

      <article className="glass-panel engineering-card">
        <h3>
          <Wrench size={18} />
          监测反馈调参逻辑
        </h3>
        <p>压力、流量、注浆量和地表沉降共同判断，不以单一压力值作为施工质量结论。</p>
        <p>沉降增大时优先核查管路和空隙填充；过压时先降低泵送并排查外漏通道。</p>
      </article>
    </section>
  );
}
