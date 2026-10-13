"use client";

import * as React from "react";

export const SIDEBAR_STORAGE_KEY = "dev-arena-sidebar-state";

export interface SidebarState {
  collapsed: boolean;
  width: number;
}

export function getSidebarState(): SidebarState {
  if (typeof window === "undefined") {
    return { collapsed: false, width: 288 }; // w-72 = 288px
  }
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { collapsed: false, width: 288 };
}

export function setSidebarState(state: Partial<SidebarState>) {
  if (typeof window === "undefined") return;
  try {
    const current = getSidebarState();
    const next = { ...current, ...state };
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("sidebar-state-change", { detail: next }));
  } catch {
    // ignore
  }
}

export function useSidebarState() {
  const [state, setState] = React.useState<SidebarState>(() => getSidebarState());

  React.useEffect(() => {
    const handler = (e: CustomEvent<SidebarState>) => setState(e.detail);
    const widthHandler = (e: CustomEvent<number>) => {
      setState((prev) => {
        const next = { ...prev, width: e.detail };
        localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };
    window.addEventListener("sidebar-state-change", handler as EventListener);
    window.addEventListener("sidebar-width-change", widthHandler as EventListener);
    return () => {
      window.removeEventListener("sidebar-state-change", handler as EventListener);
      window.removeEventListener("sidebar-width-change", widthHandler as EventListener);
    };
  }, []);

  const toggle = () => {
    const next = { ...state, collapsed: !state.collapsed };
    setState(next);
    setSidebarState(next);
  };

  const setWidth = (width: number) => {
    const next = { ...state, width: Math.max(200, Math.min(400, width)) };
    setState(next);
    setSidebarState(next);
  };

  const reset = () => {
    const next = { collapsed: false, width: 288 };
    setState(next);
    setSidebarState(next);
  };

  return { state, toggle, setWidth, reset };
}