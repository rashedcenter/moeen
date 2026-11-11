import { CurrencyCode, CurrencyConfig } from '../types';

export const STORAGE_KEY_EXCHANGE_RATES = 'moeen_custom_exchange_rates';
export const STORAGE_KEY_CURRENCY_MODE = 'moeen_currency_pricing_mode';
export const STORAGE_KEY_EXCHANGE_META = 'moeen_exchange_rates_meta';

export type CurrencyPricingMode = 'direct' | 'converted';

export interface ExchangeRateMetadata {
  lastUpdated: string;
  source: 'live_api' | 'user_custom' | 'default';
  sourceLabel: string;
}

// Live benchmark baseline rates as realistic starting defaults (updated Oct 2026)
export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  EGP: 1.0,
  SAR: 14.27, // 1 SAR ≈ 14.27 EGP
  AED: 14.57, // 1 AED ≈ 14.57 EGP
  KWD: 172.53, // 1 KWD ≈ 172.53 EGP
  USD: 53.48, // 1 USD ≈ 53.48 EGP
};

// Benchmark default steel prices per ton for direct pricing mode
export const BENCHMARK_STEEL_PRICE_PER_TON: Record<CurrencyCode, number> = {
  EGP: 41000,
  SAR: 2900,
  AED: 2850,
  KWD: 240,
  USD: 780,
};

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EGP: {
    code: 'EGP',
    symbol: 'ج.م',
    name: 'جنيه مصري',
    rateToEgp: 1,
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'ريال سعودي',
    rateToEgp: 14.27,
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'درهم إماراتي',
    rateToEgp: 14.57,
  },
  KWD: {
    code: 'KWD',
    symbol: 'د.ك',
    name: 'دينار كويتي',
    rateToEgp: 172.53,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'دولار أمريكي',
    rateToEgp: 53.48,
  },
};

/**
 * Formats a date into Arabic readable format (e.g. اليوم، 19 أكتوبر 2026 - 11:30 ص)
 */
export function formatArabicDate(date: Date = new Date()): string {
  try {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Load user customized exchange rates from localStorage, falling back to realistic defaults
 */
export function loadExchangeRates(): Record<CurrencyCode, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXCHANGE_RATES);
    if (!raw) return { ...DEFAULT_RATES };
    const parsed = JSON.parse(raw);
    return {
      EGP: 1.0,
      SAR: typeof parsed.SAR === 'number' && parsed.SAR > 0 ? parsed.SAR : DEFAULT_RATES.SAR,
      AED: typeof parsed.AED === 'number' && parsed.AED > 0 ? parsed.AED : DEFAULT_RATES.AED,
      KWD: typeof parsed.KWD === 'number' && parsed.KWD > 0 ? parsed.KWD : DEFAULT_RATES.KWD,
      USD: typeof parsed.USD === 'number' && parsed.USD > 0 ? parsed.USD : DEFAULT_RATES.USD,
    };
  } catch (e) {
    console.error('Failed to load exchange rates from storage:', e);
    return { ...DEFAULT_RATES };
  }
}

/**
 * Load exchange rates metadata (last updated, source)
 */
export function loadExchangeRateMetadata(): ExchangeRateMetadata {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXCHANGE_META);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lastUpdated) return parsed;
    }
  } catch {
    // fallback
  }
  return {
    lastUpdated: 'تحديث اليوم التلقائي',
    source: 'default',
    sourceLabel: 'سعر الصرف الاسترشادي للسوق',
  };
}

/**
 * Save user custom exchange rates into localStorage
 */
export function saveExchangeRates(
  rates: Record<CurrencyCode, number>,
  meta?: Partial<ExchangeRateMetadata>
): void {
  try {
    localStorage.setItem(STORAGE_KEY_EXCHANGE_RATES, JSON.stringify(rates));
    const currentMeta = loadExchangeRateMetadata();
    const newMeta: ExchangeRateMetadata = {
      lastUpdated: meta?.lastUpdated || formatArabicDate(new Date()),
      source: meta?.source || 'user_custom',
      sourceLabel: meta?.sourceLabel || 'سعر محدد يدوياً من المستخدم',
    };
    localStorage.setItem(STORAGE_KEY_EXCHANGE_META, JSON.stringify(newMeta));
  } catch (e) {
    console.error('Failed to save exchange rates:', e);
  }
}

/**
 * Fetch live official daily exchange rates from a public API
 */
export async function fetchLiveExchangeRates(): Promise<{
  rates: Record<CurrencyCode, number>;
  metadata: ExchangeRateMetadata;
}> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/EGP');
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    if (data && data.rates) {
      // 1 EGP = data.rates[CURR]
      // Therefore 1 CURR = (1 / data.rates[CURR]) EGP
      const sarRate = data.rates.SAR ? Math.round((1 / data.rates.SAR) * 100) / 100 : DEFAULT_RATES.SAR;
      const aedRate = data.rates.AED ? Math.round((1 / data.rates.AED) * 100) / 100 : DEFAULT_RATES.AED;
      const kwdRate = data.rates.KWD ? Math.round((1 / data.rates.KWD) * 100) / 100 : DEFAULT_RATES.KWD;
      const usdRate = data.rates.USD ? Math.round((1 / data.rates.USD) * 100) / 100 : DEFAULT_RATES.USD;

      const newRates: Record<CurrencyCode, number> = {
        EGP: 1.0,
        SAR: sarRate,
        AED: aedRate,
        KWD: kwdRate,
        USD: usdRate,
      };

      const dateStr = formatArabicDate(new Date());
      const newMeta: ExchangeRateMetadata = {
        lastUpdated: dateStr,
        source: 'live_api',
        sourceLabel: 'سعر الصرف المباشر الحي اليوم',
      };

      saveExchangeRates(newRates, newMeta);
      return { rates: newRates, metadata: newMeta };
    }
    throw new Error('Invalid rate data format');
  } catch (err) {
    console.warn('Failed to fetch live rates, falling back to local storage/defaults:', err);
    const existing = loadExchangeRates();
    const existingMeta = loadExchangeRateMetadata();
    return { rates: existing, metadata: existingMeta };
  }
}

/**
 * Pricing mode:
 * - 'direct': treats the numbers directly in the selected currency without exchange rate conversion (independent local market pricing)
 * - 'converted': converts baseline Egyptian material/labor costs by the user's custom daily exchange rate
 */
export function loadCurrencyPricingMode(): CurrencyPricingMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENCY_MODE);
    if (raw === 'direct' || raw === 'converted') return raw;
    // Default to direct independent pricing to prevent wrong exchange rate calculations for foreign users
    return 'direct';
  } catch {
    return 'direct';
  }
}

export function saveCurrencyPricingMode(mode: CurrencyPricingMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENCY_MODE, mode);
  } catch (e) {
    console.error('Failed to save currency mode:', e);
  }
}

/**
 * Get active rate for a given currency
 */
export function getActiveRate(currency: CurrencyCode): number {
  if (currency === 'EGP') return 1.0;
  const rates = loadExchangeRates();
  return rates[currency] || DEFAULT_RATES[currency] || 1.0;
}

/**
 * Convert an amount between currencies
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates?: Record<CurrencyCode, number>
): number {
  if (from === to) return amount;
  const currentRates = rates || loadExchangeRates();
  const fromRateInEgp = from === 'EGP' ? 1.0 : (currentRates[from] || 1.0);
  const toRateInEgp = to === 'EGP' ? 1.0 : (currentRates[to] || 1.0);

  // Convert `from` to EGP first, then EGP to `to`
  const amountInEgp = amount * fromRateInEgp;
  return amountInEgp / toRateInEgp;
}

export function formatNumber(n: number, decimals: number = 2): string {
  if (isNaN(n) || !isFinite(n)) return '0';
  return Number(n).toLocaleString('ar-EG', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals > 0 && Math.abs(n % 1) > 0.001 ? 1 : 0,
  });
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const conf = CURRENCIES[currency] || CURRENCIES.EGP;
  return `${formatNumber(amount, 0)} ${conf.symbol}`;
}
