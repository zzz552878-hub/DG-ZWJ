import { useCallback, useEffect, useRef, useState } from "react";

interface SpeakOptions {
  stepIndex?: number;
}

interface NarrationScriptLike {
  text?: string;
  narration?: string;
}

function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

export function useNarration() {
  const supported = isSpeechSupported();
  const [rate, setRateState] = useState(0.95);
  const [volume, setVolumeState] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [currentText, setCurrentText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [voicesReady, setVoicesReady] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const playbackIdRef = useRef(0);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const rateRef = useRef(rate);
  const volumeRef = useRef(volume);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const clearSpeechState = useCallback(() => {
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const resolvePending = useCallback(() => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    if (resolve) resolve();
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    playbackIdRef.current += 1;
    window.speechSynthesis.cancel();
    resolvePending();
    clearSpeechState();
  }, [clearSpeechState, resolvePending, supported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const content = text.trim();
      if (!supported) {
        setErrorMessage("当前浏览器不支持语音讲解");
        return Promise.resolve();
      }
      if (!content) return Promise.resolve();

      playbackIdRef.current += 1;
      const playbackId = playbackIdRef.current;
      window.speechSynthesis.cancel();
      resolvePending();

      return new Promise<void>((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled || playbackId !== playbackIdRef.current) return;
          settled = true;
          resolveRef.current = null;
          clearSpeechState();
          resolve();
        };

        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = "zh-CN";
        utterance.rate = rateRef.current;
        utterance.pitch = 1;
        utterance.volume = volumeRef.current;
        if (voiceRef.current) {
          utterance.voice = voiceRef.current;
        }

        utterance.onstart = () => {
          if (playbackId !== playbackIdRef.current) return;
          setErrorMessage("");
          setIsSpeaking(true);
          setIsPaused(false);
          setCurrentStep(options.stepIndex ?? null);
          setCurrentText(content);
        };
        utterance.onpause = () => {
          if (playbackId === playbackIdRef.current) setIsPaused(true);
        };
        utterance.onresume = () => {
          if (playbackId === playbackIdRef.current) setIsPaused(false);
        };
        utterance.onend = finish;
        utterance.onerror = () => {
          if (playbackId === playbackIdRef.current) {
            setErrorMessage("语音播放失败，请重试或检查浏览器权限。");
          }
          finish();
        };

        utteranceRef.current = utterance;
        resolveRef.current = finish;
        window.speechSynthesis.speak(utterance);
      });
    },
    [clearSpeechState, resolvePending, supported]
  );

  const speakStep = useCallback(
    (stepIndex: number, scripts: NarrationScriptLike[]) => {
      const script = scripts[stepIndex];
      return speak(script?.narration ?? script?.text ?? "", { stepIndex });
    },
    [speak]
  );

  const pause = useCallback(() => {
    if (!supported || !window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
    if (currentText) setIsSpeaking(true);
  }, [currentText, supported]);

  const setRate = useCallback((value: number) => {
    setRateState(value);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
  }, []);

  useEffect(() => {
    if (!supported) return undefined;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((voice) => voice.lang.toLowerCase() === "zh-cn") ??
        voices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) ??
        null;
      setVoicesReady(voices.length > 0);
    };

    updateVoices();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && window.speechSynthesis.paused) {
        setIsPaused(true);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    window.addEventListener("beforeunload", stop);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.removeEventListener("beforeunload", stop);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stop();
    };
  }, [stop, supported]);

  return {
    supported,
    voicesReady,
    speak,
    speakStep,
    pause,
    resume,
    stop,
    setRate,
    setVolume,
    rate,
    volume,
    isSpeaking,
    isPaused,
    currentStep,
    currentText,
    errorMessage
  };
}
