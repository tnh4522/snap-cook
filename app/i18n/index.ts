import { useCallback } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { translations, TranslationSchema } from './translations';
import { RecipeLanguage } from '@/types/recipe';

export { translations };
export type { TranslationSchema };

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationSchema>;

/**
 * Direct lookup function for a translation key with an explicit language code.
 */
export function translate(
  language: RecipeLanguage,
  key: string,
  params?: Record<string, string | number | null | undefined>
): string {
  const langDict = translations[language] || translations.en;
  const parts = key.split('.');
  let current: any = langDict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English dictionary if missing in target language
      let fallbackCurrent: any = translations.en;
      for (const fPart of parts) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && fPart in fallbackCurrent) {
          fallbackCurrent = fallbackCurrent[fPart];
        } else {
          fallbackCurrent = undefined;
          break;
        }
      }
      current = fallbackCurrent;
      break;
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  if (!params) return current;

  return current.replace(/\{(\w+)\}/g, (_, placeholder) => {
    return placeholder in params && params[placeholder] != null
      ? String(params[placeholder])
      : `{${placeholder}}`;
  });
}

/**
 * Hook to access active language and translation helper bound to app preferences.
 */
export function useI18n() {
  const { preferences, updatePreferences } = useLibrary();
  const language: RecipeLanguage = preferences.language === 'vi' ? 'vi' : 'en';

  const setLanguage = useCallback(
    (lang: RecipeLanguage) => {
      updatePreferences({ language: lang });
    },
    [updatePreferences]
  );

  const t = useCallback(
    (key: TranslationKey | (string & {}), params?: Record<string, string | number | null | undefined>) => {
      return translate(language, key, params);
    },
    [language]
  );

  return {
    language,
    setLanguage,
    t,
  };
}
