import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "te" | "hi";

export const languages: { code: Lang; name: string; locale: string }[] = [
  { code: "en", name: "English", locale: "en-IN" },
  { code: "te", name: "తెలుగు", locale: "te-IN" },
  { code: "hi", name: "हिन्दी", locale: "hi-IN" },
];

const languageKey = "adrover-driver-language";

type Messages = Record<string, string>;

// Files are locales/<lang>/<namespace>.json; keys inside are flat and dotted.
const modules = import.meta.glob<Messages>("./locales/*/*.json", {
  eager: true,
  import: "default",
});

const catalog: Record<string, Messages> = {};
for (const [path, messages] of Object.entries(modules)) {
  const match = /\.\/locales\/([a-z]+)\/([a-z]+)\.json$/.exec(path);
  if (match) catalog[`${match[1]}:${match[2]}`] = messages;
}

export function isLang(value: unknown): value is Lang {
  return languages.some((language) => language.code === value);
}

export function getCachedLanguage(): Lang {
  const value = localStorage.getItem(languageKey);
  return isLang(value) ? value : "en";
}

export function cacheLanguage(lang: Lang) {
  localStorage.setItem(languageKey, lang);
}

function translate(
  lang: Lang,
  id: string,
  values?: Record<string, string | number>,
) {
  const separator = id.indexOf(":");
  const namespace = id.slice(0, separator);
  const key = id.slice(separator + 1);
  const text =
    catalog[`${lang}:${namespace}`]?.[key] ?? catalog[`en:${namespace}`]?.[key];
  if (text === undefined) return id;
  return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    String(values?.[name] ?? ""),
  );
}

type I18n = {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: (id: string, values?: Record<string, string | number>) => string;
  formatDate: (value: string, withTime?: boolean) => string;
  formatMoney: (value: number) => string;
  formatNumber: (value: number) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({
  children,
  onLanguageChange,
}: {
  children: ReactNode;
  onLanguageChange?: (lang: Lang) => void;
}) {
  const [lang, setLangState] = useState<Lang>(getCachedLanguage);

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      cacheLanguage(next);
      document.documentElement.lang = next;
      onLanguageChange?.(next);
    },
    [onLanguageChange],
  );

  const value = useMemo<I18n>(() => {
    const locale =
      languages.find((language) => language.code === lang)?.locale ?? "en-IN";
    return {
      lang,
      locale,
      setLang,
      t: (id, values) => translate(lang, id, values),
      formatDate: (iso, withTime = false) => {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return iso;
        return new Intl.DateTimeFormat(
          locale,
          withTime
            ? { dateStyle: "medium", timeStyle: "short" }
            : { dateStyle: "medium" },
        ).format(date);
      },
      formatMoney: (amount) =>
        new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }).format(amount),
      formatNumber: (amount) => new Intl.NumberFormat(locale).format(amount),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
}
