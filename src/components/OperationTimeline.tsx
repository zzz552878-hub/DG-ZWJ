import type { TimelineStep } from "../types";

interface OperationTimelineProps {
  steps: TimelineStep[];
  activeStepId: string;
  status: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onStepClick: (step: TimelineStep) => void;
}

export function OperationTimeline({
  steps,
  activeStepId,
  status,
  collapsed,
  onCollapsedChange,
  onStepClick
}: OperationTimelineProps) {
  const activeStep = steps.find((step) => step.id === activeStepId) ?? steps[0];

  return (
    <footer className={collapsed ? "bottom-deck collapsed" : "bottom-deck"}>
      <div className="timeline-head">
        <div>
          <span>施工流程时间轴</span>
          <strong>{activeStep.label}</strong>
        </div>
        <button className="soft-button" onClick={() => onCollapsedChange(!collapsed)} type="button">
          {collapsed ? "展开流程" : "收起流程"}
        </button>
      </div>

      {!collapsed ? (
        <div className="timeline-scroll" aria-label="施工流程时间轴">
          <div className="timeline">
            {steps.map((step) => (
              <button
                className={activeStepId === step.id ? "timeline-node active" : "timeline-node"}
                key={step.id}
                onClick={() => onStepClick(step)}
                type="button"
              >
                <span>{step.index}</span>
                <strong>{step.label}</strong>
                <small>{step.message}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="status-strip">
        <span>状态提示</span>
        <strong>{status}</strong>
      </div>
    </footer>
  );
}
