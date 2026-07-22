export const TOKEN_PACKS = [
  { id: "starter",  tokens: 100,  priceUsd: 12 },
  { id: "builder",  tokens: 500,  priceUsd: 50 },
  { id: "studio",   tokens: 1500, priceUsd: 120 },
] as const;

export const MEMBERSHIP_PLANS = [
  { id: "solo",   name: "Solo Builder", priceUsdMonthly: 9,  includedTokens: 80,   appsLive: 1 },
  { id: "pro",    name: "Pro Builder",  priceUsdMonthly: 39, includedTokens: 500,  appsLive: 5 },
  { id: "studio", name: "Studio",       priceUsdMonthly: 99, includedTokens: 1500, appsLive: 15 },
] as const;

export const RELEASE_FEE_USD = 25;
export const DAILY_FREE_GRANT = 3;
