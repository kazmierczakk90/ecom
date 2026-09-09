export interface EanVerificationResult {
  matchPercentage: number;
  isVerified: boolean;
  verdict: "Zgodny 100%" | "Częściowo zgodny" | "Niezgodny";
  matchedAttributes: string[];
  discrepancies?: string[];
  explanation: string;
  verifiedAt: string;
}

export interface ProductListing {
  id: string;
  sku: string;
  name: string;
  platform: "Allegro" | "Amazon.de" | "Ceneo" | "eBay" | "Amazon.pl";
  pricePLN: number;
  priceEUR?: number;
  originalPricePLN?: number;
  salesPerMonth: number;
  rating: number;
  ratingCount: number;
  status: "Aktywny" | "Promo" | "B2B" | "Braki" | "Nowy";
  roi: number;
  asin?: string;
  ean?: string;
  gtin?: string;
  brand?: string;
  modelName?: string;
  specifications?: {
    color?: string;
    size?: string;
    type?: string;
    pieces?: string;
    [key: string]: string | undefined;
  };
  matchScore?: number;
  matchCriteria?: string[];
  eanVerification?: EanVerificationResult;
  url: string;
  category: string;
  pairedListingId?: string;
}

export interface ArbitragePair {
  id: string;
  sourceId: string;
  targetId: string;
  estimatedProfitPLN: number;
  estimatedROI: number;
  vatRateSource: number;
  vatRateTarget: number;
  shippingCostEUR: number;
  allegroCommissionFeePercent: number;
  allegroFixedFeePLN: number;
  category: string;
}

export interface FilterCondition {
  id: string;
  field: "Nazwa" | "Cena" | "Sprzedaż" | "Opinie" | "Status" | "ROI";
  operator: "=" | "<" | ">" | "~";
  value: string;
}

export interface ArbitrageSettings {
  defaultVatSource: number; // e.g. 19%
  defaultVatTarget: number; // e.g. 23%
  exchangeRate: number; // e.g. 4.31
  defaultShippingCostEUR: number; // e.g. 4.99
  defaultCommissionPercent: number; // e.g. 8%
  useMockSimulation: boolean;
  defaultSourcePlatform?: string; // e.g. "Amazon.de"
  defaultTargetPlatform?: string; // e.g. "Allegro"
}

export interface Worklist {
  id: string;
  name: string;
  productIds: string[];
  isCustom?: boolean;
}

export interface SearchTemplate {
  id: string;
  name: string;
  keyword: string;
  sourcePlatform: string;
  targetPlatform: string;
  priceMin: number;
  priceMax: number;
  resultsLimit: number;
  category?: string;
  searchSource: string;
}

export interface RecentSearchItem {
  id: string;
  keyword: string;
  sourcePlatform?: string;
  targetPlatform?: string;
  platforms?: string[];
  priceMin: number;
  priceMax: number;
  category?: string;
  timestamp: number;
}

