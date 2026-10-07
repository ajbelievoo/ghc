"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const CURRENCIES = [
  "USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD", "JPY", "CNY", "HKD",
  "NZD", "CHF", "SEK", "NOK", "DKK", "PLN", "AED", "SAR", "BRL", "MXN",
  "ZAR", "KRW", "PHP", "THB", "MYR", "IDR", "VND", "TRY", "RUB", "PKR",
];

const STORAGE_KEY = "ghc-currency";

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  symbol: string;
}

const defaultContext: CurrencyContextType = { currency: "USD", setCurrency: () => {}, symbol: "$" };

const CurrencyContext = createContext<CurrencyContextType>(defaultContext);

const SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", INR: "₹", CAD: "C$", AUD: "A$", SGD: "S$",
  JPY: "¥", CNY: "¥", HKD: "HK$", NZD: "NZ$", CHF: "CHF", SEK: "kr",
  NOK: "kr", DKK: "kr", PLN: "zł", AED: "AED", SAR: "SAR", BRL: "R$",
  MXN: "MX$", ZAR: "R", KRW: "₩", PHP: "₱", THB: "฿", MYR: "RM",
  IDR: "Rp", VND: "₫", TRY: "₺", RUB: "₽", PKR: "₨",
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>("USD");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored && CURRENCIES.includes(stored)) {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = (c: string) => {
    const next = (c || "USD").toUpperCase();
    if (CURRENCIES.includes(next)) {
      setCurrencyState(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
      }
      // Re-render by dispatching a small custom event so pages can refetch
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("currencychange", { detail: next }));
      }
    }
  };

  const symbol = SYMBOLS[currency] || currency;
  return (
    <CurrencyContext.Provider value={{ currency: mounted ? currency : "USD", setCurrency, symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function getCurrencySymbol(currency: string) {
  return SYMBOLS[(currency || "USD").toUpperCase()] || (currency || "USD").toUpperCase();
}
