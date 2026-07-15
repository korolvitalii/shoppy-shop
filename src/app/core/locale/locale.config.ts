import localeData from '../../../locale/locales.json';

export interface AppLocale {
  locale: string;
  path: string;
  hreflang: string;
  label: string;
  shortLabel: string;
  default: boolean;
}

export const supportedLocales: readonly AppLocale[] = localeData;
export type SupportedLocale = (typeof localeData)[number]['locale'];

export function getLocaleDefinition(locale: string): AppLocale {
  return (
    supportedLocales.find((candidate) => candidate.locale === locale) ??
    supportedLocales.find((candidate) => candidate.default) ??
    supportedLocales[0]
  );
}

export function getDefaultLocale(): AppLocale {
  return getLocaleDefinition('');
}
