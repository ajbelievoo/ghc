"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.remove("light", "dark");
    root.classList.add(next ? "dark" : "light");
    try { localStorage.setItem("ghc-theme", next ? "dark" : "light"); } catch {}
    setIsDark(next);
  };

  return (
    <button
      onClick={toggle}
      className={`rounded-lg p-2 transition-colors ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
