import i18next, {type TOptions} from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from '@/i18n/locales/EN/translation.json';
import cn from '@/i18n/locales/CN/translation.json';
import {Logger} from '@/infrastructure/logging/Logger';

const DEFAULT_LANGUAGE = 'EN';
const LANGUAGE_MAP: Record<string, string> = {
  EN: 'EN',
  CN: 'CN',
  ZH: 'CN',
  'ZH-CN': 'CN',
  'ZH-HANS': 'CN',
  'zh-CN': 'CN',
  'zh-Hans': 'CN',
};

const resources = {
  EN: {
    translation: en,
  },
  CN: {
    translation: cn,
  },
} as const;

function normalizeLanguage(language: string | undefined): string {
  if (!language) {
    return DEFAULT_LANGUAGE;
  }

  return LANGUAGE_MAP[language] ?? LANGUAGE_MAP[language.toUpperCase()] ?? DEFAULT_LANGUAGE;
}

i18next
  .use(initReactI18next)
  .init({
    lng: normalizeLanguage(typeof TranslationLanguage !== 'undefined' ? TranslationLanguage : undefined),
    fallbackLng: DEFAULT_LANGUAGE,
    resources,
    initAsync: false,
    interpolation: {
      escapeValue: false,
      prefix: '{',
      suffix: '}',
    },
    returnNull: false,
    returnEmptyString: false,
    missingKeyHandler: (_lngs, _namespace, key) => {
      Logger.warn(`Missing translation: ${key}`);
    },
    saveMissing: true,
  })
  .catch(error => {
    Logger.error('Failed to initialize i18n:', error);
  });

let lastLanguage = i18next.language;

setInterval(() => {
  const nextLanguage = normalizeLanguage(typeof TranslationLanguage !== 'undefined' ? TranslationLanguage : undefined);

  if (nextLanguage !== lastLanguage) {
    lastLanguage = nextLanguage;
    i18next.changeLanguage(nextLanguage).catch(error => {
      Logger.error(`Failed to change language to ${nextLanguage}:`, error);
    });
    Logger.debug(`Language changed to ${nextLanguage}`);
    window.bmm.app?.forceUpdate();
  }
}, 5000);

export function currentLanguage(): string {
  return lastLanguage || DEFAULT_LANGUAGE;
}

export function t(key: string, variables?: Record<string, string | number>): string {
  const options: TOptions = {
    defaultValue: `missing translation: ${key}`,
    ...(variables ?? {}),
  };

  return i18next.t(key, options);
}

export {i18next};
export default t;
