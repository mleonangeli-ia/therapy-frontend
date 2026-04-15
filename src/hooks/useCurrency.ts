"use client";
import { useEffect, useState } from "react";

// Map country code → { currency code, locale for formatting }
const COUNTRY_CURRENCY: Record<string, { currency: string; locale: string }> = {
  AR: { currency: "ARS", locale: "es-AR" },
  US: { currency: "USD", locale: "en-US" },
  MX: { currency: "MXN", locale: "es-MX" },
  CO: { currency: "COP", locale: "es-CO" },
  CL: { currency: "CLP", locale: "es-CL" },
  PE: { currency: "PEN", locale: "es-PE" },
  BR: { currency: "BRL", locale: "pt-BR" },
  UY: { currency: "UYU", locale: "es-UY" },
  PY: { currency: "PYG", locale: "es-PY" },
  BO: { currency: "BOB", locale: "es-BO" },
  EC: { currency: "USD", locale: "es-EC" },
  VE: { currency: "USD", locale: "es-VE" },
  ES: { currency: "EUR", locale: "es-ES" },
  GB: { currency: "GBP", locale: "en-GB" },
  CA: { currency: "CAD", locale: "en-CA" },
  AU: { currency: "AUD", locale: "en-AU" },
  DE: { currency: "EUR", locale: "de-DE" },
  FR: { currency: "EUR", locale: "fr-FR" },
  IT: { currency: "EUR", locale: "it-IT" },
  PT: { currency: "EUR", locale: "pt-PT" },
};

interface CurrencyInfo {
  countryCode: string;
  currency: string;
  locale: string;
  rate: number; // multiplier from ARS to target currency
  loading: boolean;
}

const DEFAULT: CurrencyInfo = {
  countryCode: "AR",
  currency: "ARS",
  locale: "es-AR",
  rate: 1,
  loading: true,
};

export function useCurrency(): CurrencyInfo {
  const [info, setInfo] = useState<CurrencyInfo>(DEFAULT);

  useEffect(() => {
    async function detect() {
      try {
        // 1. Detect country
        const geo = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
        const geoData = await geo.json();
        const countryCode: string = geoData.country_code ?? "AR";
        const target = COUNTRY_CURRENCY[countryCode] ?? COUNTRY_CURRENCY["US"];

        if (target.currency === "ARS") {
          setInfo({ countryCode, ...target, rate: 1, loading: false });
          return;
        }

        // 2. Get exchange rate ARS → target currency (free API, no key needed)
        const rateRes = await fetch(
          `https://api.frankfurter.app/latest?from=ARS&to=${target.currency}`,
          { signal: AbortSignal.timeout(4000) }
        );
        const rateData = await rateRes.json();
        const rate: number = rateData.rates?.[target.currency] ?? 1;

        setInfo({ countryCode, ...target, rate, loading: false });
      } catch {
        // Fallback to ARS on any error
        setInfo({ ...DEFAULT, loading: false });
      }
    }
    detect();
  }, []);

  return info;
}

export function formatPrice(amountARS: number, info: CurrencyInfo): string {
  const converted = amountARS * info.rate;
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.currency,
      maximumFractionDigits: info.currency === "CLP" || info.currency === "PYG" ? 0 : 2,
    }).format(converted);
  } catch {
    return `${info.currency} ${converted.toFixed(0)}`;
  }
}
