"use client";

import * as React from "react";
import { Select, SelectOption } from "@adinkra/select";
import { en } from "../i18n/en";
import { pt, type MessageKey } from "../i18n/pt";

export type Lang = "pt" | "en";

export const LANG_STORAGE_KEY = "adinkra-lang";

const messages: Record<Lang, Record<MessageKey, string>> = { pt, en };

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Texto puro da chave no idioma atual (crases ficam como estão). */
  t: (key: MessageKey) => string;
}

const LangContext = React.createContext<LangContextValue>({
  lang: "pt",
  setLang: () => {},
  t: (key) => pt[key],
});

/**
 * Idioma do site. Português é sempre o padrão (e o que o servidor renderiza);
 * a escolha explícita do seletor fica no localStorage e vale a partir da
 * montagem no cliente. Também mantém o `lang` do <html> em dia, pra leitores
 * de tela e tradutores do navegador.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("pt");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === "pt" || saved === "en") setLangState(saved);
    } catch {
      // localStorage bloqueado: fica no padrão (português) nesta visita.
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  }, [lang]);

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Vale só nesta visita.
    }
  }, []);

  const value = React.useMemo<LangContextValue>(
    () => ({ lang, setLang, t: (key) => messages[lang][key] }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return React.useContext(LangContext);
}

/**
 * Texto de uma chave de i18n/pt.ts, usável dentro de Server Components:
 * `<T k="common.home" />`. Trechos entre crases viram <code>.
 */
export function T({ k }: { k: MessageKey }) {
  const { t } = useLang();
  const parts = t(k).split("`");
  if (parts.length === 1) return <>{parts[0]}</>;
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <code key={index}>{part}</code> : <React.Fragment key={index}>{part}</React.Fragment>,
      )}
    </>
  );
}

/**
 * Escolhe entre dois conteúdos já renderizados no servidor (ex.: o MDX de uma
 * página em cada idioma). Só o do idioma atual monta no cliente; sem versão
 * em inglês, mostra o português.
 */
export function Localized({ pt, en }: { pt: React.ReactNode; en?: React.ReactNode }) {
  const { lang } = useLang();
  return <>{lang === "en" && en ? en : pt}</>;
}

export function LanguageSelect() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="w-32">
      <Select
        aria-label={t("language.label")}
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        className="h-7.5 text-xs"
      >
        <SelectOption value="pt">{pt["language.pt"]}</SelectOption>
        <SelectOption value="en">{pt["language.en"]}</SelectOption>
      </Select>
    </div>
  );
}
