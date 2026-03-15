import { useEffect, useState, useRef, type Dispatch, type SetStateAction } from "react";

export function useCrossTabState<T>(stateKey: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaultValue);
  const isNewSession = useRef(true);
  useEffect(() => {
    if (isNewSession.current) {
      const currentState = localStorage.getItem(stateKey);
      if (currentState) {
        setState(currentState === "undefined" ? undefined : JSON.parse(currentState));
      } else {
        setState(defaultValue);
      }
      isNewSession.current = false;
      return;
    }
    try {
      localStorage.setItem(stateKey, JSON.stringify(state));
    } catch (error) {}
  }, [state, stateKey, defaultValue]);
  useEffect(() => {
    const onReceieveMessage = (e: StorageEvent) => {
      const { key, newValue } = e;
      if (key === stateKey) {
        setState(newValue === null || newValue === "undefined" ? undefined : JSON.parse(newValue));
      }
    };
    window.addEventListener("storage", onReceieveMessage);
    return () => window.removeEventListener("storage", onReceieveMessage);
  }, [stateKey, setState]);
  return [state, setState];
}
