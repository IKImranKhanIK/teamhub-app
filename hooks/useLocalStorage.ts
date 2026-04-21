"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const item = localStorage.getItem(key);
      if (item !== null) setStoredValue(JSON.parse(item));
    } catch {
      // keep initialValue on parse error
    }
  }, [key]);

  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(next));
      }
      return next;
    });
  };

  return [storedValue, setValue];
}
