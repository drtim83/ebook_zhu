import { getLanguage } from "./languages";

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Read text aloud using the browser's built-in voices, picking one matching the language. */
export function speak(text: string, langCode: string): void {
  if (!isSpeechSupported() || !text.trim()) return;
  stopSpeaking();

  const lang = getLanguage(langCode);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang.speechLocale;

  const voices = window.speechSynthesis.getVoices();
  const match =
    voices.find((v) => v.lang === lang.speechLocale) ||
    voices.find((v) => v.lang.startsWith(lang.code));
  if (match) utterance.voice = match;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return isSpeechSupported() && window.speechSynthesis.speaking;
}
