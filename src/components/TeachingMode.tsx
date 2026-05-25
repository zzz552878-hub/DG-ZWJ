import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX
} from "lucide-react";
import { useState } from "react";
import type { QuizQuestion, TeachingStep } from "../types";

interface TeachingModeProps {
  enabled: boolean;
  autoNarrationPlaying: boolean;
  voiceEnabled: boolean;
  voiceSupported: boolean;
  rate: number;
  volume: number;
  isSpeaking: boolean;
  isPaused: boolean;
  completed: boolean;
  errorMessage: string;
  steps: TeachingStep[];
  questions: QuizQuestion[];
  activeIndex: number;
  onStepChange: (index: number) => void;
  onStartNarration: () => void;
  onStopNarration: () => void;
  onVoiceEnabledChange: (enabled: boolean) => void;
  onSpeakCurrent: () => void;
  onPauseSpeech: () => void;
  onResumeSpeech: () => void;
  onStopSpeech: () => void;
  onRateChange: (rate: number) => void;
  onVolumeChange: (volume: number) => void;
}

export function TeachingMode({
  enabled,
  autoNarrationPlaying,
  voiceEnabled,
  voiceSupported,
  rate,
  volume,
  isSpeaking,
  isPaused,
  completed,
  errorMessage,
  steps,
  questions,
  activeIndex,
  onStepChange,
  onStartNarration,
  onStopNarration,
  onVoiceEnabledChange,
  onSpeakCurrent,
  onPauseSpeech,
  onResumeSpeech,
  onStopSpeech,
  onRateChange,
  onVolumeChange
}: TeachingModeProps) {
  const [showAnswers, setShowAnswers] = useState(false);

  if (!enabled) {
    return null;
  }

  const step = steps[activeIndex];
  const isLast = activeIndex === steps.length - 1;

  return (
    <section className="teaching-panel">
      <div className="teaching-head">
        <BookOpenCheck size={19} />
        <div>
          <span>教学模式</span>
          <strong>{step.title}</strong>
        </div>
      </div>

      <p>{step.description}</p>
      <div className="teaching-focus">
        <span>重点部件</span>
        <strong>{step.focus}</strong>
        <span>观察提示</span>
        <p>{step.observation}</p>
      </div>
      {completed ? <div className="completion-note">讲解完成，可自由观察模型或重新播放。</div> : null}

      <div className="teaching-nav">
        <button
          className="soft-button"
          disabled={activeIndex === 0}
          onClick={() => onStepChange(activeIndex - 1)}
          type="button"
        >
          <ChevronLeft size={15} />
          上一步
        </button>
        <button
          className="soft-button"
          disabled={isLast}
          onClick={() => onStepChange(activeIndex + 1)}
          type="button"
        >
          下一步
          <ChevronRight size={15} />
        </button>
        <button className="soft-button accent" onClick={autoNarrationPlaying ? onStopNarration : onStartNarration} type="button">
          {autoNarrationPlaying ? <Square size={14} /> : <Play size={14} />}
          {autoNarrationPlaying ? "停止自动讲解" : "开始讲解"}
        </button>
      </div>

      <div className="voice-panel">
        <div className="voice-head">
          {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          <strong>中文讲解声音</strong>
          <button className={voiceEnabled ? "mode-chip active" : "mode-chip"} onClick={() => onVoiceEnabledChange(!voiceEnabled)} type="button">
            {voiceEnabled ? "关闭讲解声音" : "开启讲解声音"}
          </button>
        </div>

        {!voiceSupported ? <p className="voice-warning">当前浏览器不支持语音讲解</p> : null}
        {errorMessage ? <p className="voice-warning">{errorMessage}</p> : null}

        <div className="voice-buttons">
          <button className="soft-button" disabled={!voiceSupported || !voiceEnabled} onClick={onSpeakCurrent} type="button">
            <Play size={14} />
            播放当前讲解
          </button>
          <button className="soft-button" disabled={!voiceSupported || !voiceEnabled || !isSpeaking || isPaused} onClick={onPauseSpeech} type="button">
            <Pause size={14} />
            暂停讲解
          </button>
          <button className="soft-button" disabled={!voiceSupported || !voiceEnabled || !isPaused} onClick={onResumeSpeech} type="button">
            <Play size={14} />
            继续讲解
          </button>
          <button className="soft-button" disabled={!voiceSupported || !voiceEnabled || (!isSpeaking && !isPaused)} onClick={onStopSpeech} type="button">
            <Square size={14} />
            停止讲解
          </button>
        </div>

        <label className="voice-range">
          <span>语速 {rate.toFixed(2)}</span>
          <input
            aria-label="语速"
            disabled={!voiceSupported}
            max={1.4}
            min={0.65}
            onChange={(event) => onRateChange(Number(event.target.value))}
            step={0.05}
            type="range"
            value={rate}
          />
        </label>
        <label className="voice-range">
          <span>音量 {Math.round(volume * 100)}%</span>
          <input
            aria-label="音量"
            disabled={!voiceSupported}
            max={1}
            min={0}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            step={0.05}
            type="range"
            value={volume}
          />
        </label>
      </div>

      {isLast ? (
        <div className="quiz-box">
          <h4>
            <MessageSquareText size={16} />
            课后互动
          </h4>
          {questions.map((item) => (
            <div className="quiz-item" key={item.id}>
              <strong>{item.question}</strong>
              <textarea aria-label={item.question} placeholder="在课堂中口答或记录要点" rows={2} />
              {showAnswers ? <p>{item.answer}</p> : null}
            </div>
          ))}
          <button className="soft-button" onClick={() => setShowAnswers((value) => !value)} type="button">
            {showAnswers ? "收起参考答案" : "显示参考答案"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
