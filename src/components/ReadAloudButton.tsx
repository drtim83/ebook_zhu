"use client";

import { useEffect, useRef, useState } from "react";
import { isSpeechSupported, speak, stopSpeaking } from "@/lib/speech";

interface ReadAloudButtonProps {
  text: string;
  lang: string;
  label?: string;
}

export default function ReadAloudButton({ text, lang, label = "Read aloud" }: ReadAloudButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    queueMicrotask(() => setSupported(isSpeechSupported()));
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopSpeaking();
    };
  }, []);

  // Stop reading if the underlying text changes out from under us.
  useEffect(() => {
    return () => stopSpeaking();
  }, [text]);

  function toggle() {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    if (!text.trim()) return;
    speak(text, lang);
    setSpeaking(true);
    pollRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setSpeaking(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 300);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!text.trim()}
      className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:text-neutral-200 dark:hover:bg-white/10"
    >
      {speaking ? "⏹ Stop" : `🔊 ${label}`}
    </button>
  );
}
