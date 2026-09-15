export interface LanguageOption {
  /** BCP-47-ish code used for translation (LibreTranslate) and speech synthesis. */
  code: string;
  label: string;
  /** Tesseract.js traineddata code, used for OCR. */
  tesseractCode: string;
  /** Preferred locale for the Web Speech API voice lookup. */
  speechLocale: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", tesseractCode: "eng", speechLocale: "en-US" },
  { code: "zh", label: "Chinese (Simplified)", tesseractCode: "chi_sim", speechLocale: "zh-CN" },
  { code: "zh-TW", label: "Chinese (Traditional)", tesseractCode: "chi_tra", speechLocale: "zh-TW" },
  { code: "ms", label: "Malay", tesseractCode: "msa", speechLocale: "ms-MY" },
  { code: "es", label: "Spanish", tesseractCode: "spa", speechLocale: "es-ES" },
  { code: "fr", label: "French", tesseractCode: "fra", speechLocale: "fr-FR" },
  { code: "ja", label: "Japanese", tesseractCode: "jpn", speechLocale: "ja-JP" },
  { code: "ko", label: "Korean", tesseractCode: "kor", speechLocale: "ko-KR" },
  { code: "id", label: "Indonesian", tesseractCode: "ind", speechLocale: "id-ID" },
  { code: "de", label: "German", tesseractCode: "deu", speechLocale: "de-DE" },
];

export function getLanguage(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
