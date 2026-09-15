export type OcrEngine = "tesseract" | "gemini";
export type TranslationEngine = "libretranslate" | "gemini";

export interface AppSettings {
  ocrEngine: OcrEngine;
  translationEngine: TranslationEngine;
  geminiApiKey: string;
  geminiModel: string;
  googleDriveApiKey: string;
}

const STORAGE_KEY = "ebook-app:settings";

export const DEFAULT_SETTINGS: AppSettings = {
  ocrEngine: "gemini",
  translationEngine: "gemini",
  geminiApiKey: "",
  geminiModel: "gemini-2.5-flash",
  googleDriveApiKey: "",
};

/** Settings live only in this browser's localStorage — never sent to our own server. */
export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
