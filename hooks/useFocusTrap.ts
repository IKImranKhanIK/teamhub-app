"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  onEscape?: () => void
) {
  const ref = useRef<T>(null);
  // Use a ref for the callback so the effect doesn't need to re-run when it changes
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const getFocusable = () => Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));

    // Focus first element in modal on open
    getFocusable()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscapeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) { e.preventDefault(); return; }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Return focus to the element that opened the modal
      previousFocus?.focus();
    };
  }, []);

  return ref;
}
