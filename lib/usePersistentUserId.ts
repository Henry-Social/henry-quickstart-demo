"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "henry-user-id";

export function usePersistentUserId() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      setUserId(existing);
      return;
    }

    const generated = `user_${Math.random().toString(36).slice(2, 9)}`;
    window.localStorage.setItem(STORAGE_KEY, generated);
    setUserId(generated);
  }, []);

  return userId;
}
