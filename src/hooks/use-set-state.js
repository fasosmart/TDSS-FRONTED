import { useMemo, useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';

import dayjs from 'src/utils/format-time';
import { isEqual } from 'src/utils/helper';
import { usePathname, useRouter, useSearchParams } from 'src/routes/hooks';

// ----------------------------------------------------------------------

const STORAGE_PREFIX = 'tdss:set-state';
const DAYJS_MARKER = '__DAYJS__';
const DATE_KEY_PATTERN = /(date|_at|before|after|start|end)/i;

function createStorageKey({ storageKey, persistByPath, pathname }) {
  if (storageKey) return `${STORAGE_PREFIX}:${storageKey}`;
  if (!persistByPath) return null;

  const safePath = (pathname || '/').replace(/[^\w/-]/g, '_');

  return `${STORAGE_PREFIX}:${safePath}`;
}

function encodeState(state) {
  const payload = {};

  Object.entries(state || {}).forEach(([key, value]) => {
    if (value === undefined) return;

    // Keep DatePicker values stable across reloads (dayjs -> ISO marker).
    if (value && DATE_KEY_PATTERN.test(key)) {
      const parsed = dayjs(value);
      if (parsed.isValid()) {
        payload[key] = `${DAYJS_MARKER}${parsed.toISOString()}`;
        return;
      }
    }

    payload[key] = value;
  });

  return JSON.stringify(payload);
}

function decodeState(rawValue) {
  const parsed = JSON.parse(rawValue);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const restored = { ...parsed };

  Object.entries(restored).forEach(([key, value]) => {
    if (typeof value !== 'string') return;

    if (value.startsWith(DAYJS_MARKER) && DATE_KEY_PATTERN.test(key)) {
      const parsedDate = dayjs(value.replace(DAYJS_MARKER, ''));
      restored[key] = parsedDate.isValid() ? parsedDate : null;
    }
  });

  return restored;
}

function isDateLikeValue(value, key) {
  if (!DATE_KEY_PATTERN.test(key)) return false;
  if (value === null || value === undefined || value === '') return false;
  return dayjs(value).isValid();
}

function isPrimitive(value) {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function isSerializableArray(value) {
  return Array.isArray(value) && value.every((item) => isPrimitive(item));
}

function isComplexObject(value, key) {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return !isSerializableArray(value);
  if (isDateLikeValue(value, key)) return false;
  return typeof value === 'object';
}

function toDateComparable(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
}

function hasMeaningfulChange(nextValue, initialValue, key) {
  if (Array.isArray(nextValue)) {
    return !isEqual(nextValue, initialValue);
  }

  if (isDateLikeValue(nextValue, key) || isDateLikeValue(initialValue, key)) {
    return toDateComparable(nextValue) !== toDateComparable(initialValue);
  }

  return !isEqual(nextValue, initialValue);
}

function serializeQueryValue(value, key) {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }

  if (isDateLikeValue(value, key)) {
    return dayjs(value).format('YYYY-MM-DD');
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function parseQueryValue(rawValue, initialValue, key) {
  if (Array.isArray(initialValue)) {
    if (!rawValue) return [];
    return rawValue
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof initialValue === 'boolean') {
    return rawValue === 'true';
  }

  if (typeof initialValue === 'number') {
    const parsed = Number(rawValue);
    return Number.isNaN(parsed) ? initialValue : parsed;
  }

  if (isDateLikeValue(initialValue, key) || (initialValue === null && DATE_KEY_PATTERN.test(key))) {
    const parsedDate = dayjs(rawValue);
    return parsedDate.isValid() ? parsedDate : null;
  }

  return rawValue;
}

export function useSetState(initialState, options = {}) {
  const { persistByPath = false, storageKey, syncWithUrl = persistByPath } = options;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStateRef = useRef(initialState);
  const managedKeysRef = useRef(Object.keys(initialStateRef.current || {}));
  const [state, set] = useState(initialStateRef.current);
  const [isHydrated, setIsHydrated] = useState(false);
  const searchParamsString = searchParams.toString();

  const persistKey = useMemo(
    () =>
      createStorageKey({
        storageKey,
        persistByPath,
        pathname,
      }),
    [storageKey, persistByPath, pathname]
  );

  useLayoutEffect(() => {
    if (!persistKey) {
      setIsHydrated(true);
      return;
    }

    try {
      const saved = window.localStorage.getItem(persistKey);

      if (saved) {
        const restored = decodeState(saved);
        if (restored) {
          set((prevValue) => ({ ...prevValue, ...restored }));
        }
      }
    } catch (error) {
      console.error('Error while restoring persisted state:', error);
    } finally {
      setIsHydrated(true);
    }
  }, [persistKey]);

  useEffect(() => {
    if (!persistKey || !isHydrated) return;

    try {
      if (isEqual(state, initialStateRef.current)) {
        window.localStorage.removeItem(persistKey);
        return;
      }

      window.localStorage.setItem(persistKey, encodeState(state));
    } catch (error) {
      console.error('Error while persisting state:', error);
    }
  }, [persistKey, state, isHydrated]);

  useLayoutEffect(() => {
    if (!syncWithUrl || !isHydrated) return;

    const managedKeys = managedKeysRef.current;
    const params = new URLSearchParams(searchParamsString);
    const hasManagedParam = managedKeys.some((key) => params.has(key));

    if (!hasManagedParam) return;

    set((prevValue) => {
      const nextState = {};

      managedKeys.forEach((key) => {
        const initialValue = initialStateRef.current[key];
        const currentValue = prevValue[key];
        if (isComplexObject(initialValue, key) || isComplexObject(currentValue, key)) return;

        const parsedValue = params.has(key)
          ? parseQueryValue(params.get(key), initialValue, key)
          : initialValue;

        if (hasMeaningfulChange(parsedValue, currentValue, key)) {
          nextState[key] = parsedValue;
        }
      });

      return Object.keys(nextState).length > 0 ? { ...prevValue, ...nextState } : prevValue;
    });
  }, [syncWithUrl, isHydrated, searchParamsString]);

  useEffect(() => {
    if (!syncWithUrl || !isHydrated) return;

    const managedKeys = managedKeysRef.current;
    const nextParams = new URLSearchParams(searchParamsString);

    managedKeys.forEach((key) => nextParams.delete(key));

    managedKeys.forEach((key) => {
      const initialValue = initialStateRef.current[key];
      const currentValue = state[key];
      if (isComplexObject(initialValue, key) || isComplexObject(currentValue, key)) return;

      if (!hasMeaningfulChange(currentValue, initialValue, key)) {
        return;
      }

      const serializedValue = serializeQueryValue(currentValue, key);
      if (serializedValue !== '') {
        nextParams.set(key, serializedValue);
      }
    });

    const nextQuery = nextParams.toString();

    if (nextQuery !== searchParamsString) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [syncWithUrl, isHydrated, searchParamsString, state, pathname, router]);

  const canReset = !isEqual(state, initialStateRef.current);

  const setState = useCallback((updateState) => {
    set((prevValue) => {
      const partialUpdate =
        typeof updateState === 'function' ? updateState(prevValue) : updateState;

      if (!partialUpdate || typeof partialUpdate !== 'object') {
        return prevValue;
      }

      return { ...prevValue, ...partialUpdate };
    });
  }, []);

  const setField = useCallback(
    (name, updateValue) => {
      setState({
        [name]: updateValue,
      });
    },
    [setState]
  );

  const onResetState = useCallback(() => {
    set(initialStateRef.current);

    if (!persistKey) return;

    try {
      window.localStorage.removeItem(persistKey);
    } catch (error) {
      console.error('Error while clearing persisted state:', error);
    }
  }, [persistKey]);

  const memoizedValue = useMemo(
    () => ({
      state,
      setState,
      setField,
      onResetState,
      canReset,
      isHydrated,
    }),
    [canReset, isHydrated, onResetState, setField, setState, state]
  );

  return memoizedValue;
}
