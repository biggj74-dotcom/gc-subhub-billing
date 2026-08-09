import { Alert } from 'react-native';
import { makeL } from '../i18n/dict';
import { useLanguageStore } from '../i18n/useLanguage';

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Something went wrong.';
}

/**
 * Standard mutation error handler — pass as `onError` on any useMutation
 * call. Reads the current language directly from the store (outside a
 * component, so no useL() hook available here) rather than requiring every
 * call site to thread a translator through.
 */
export function showError(err: unknown) {
  const L = makeL(useLanguageStore.getState().lang);
  Alert.alert(L('somethingWentWrong'), getErrorMessage(err));
}
