import React, { useState, useEffect } from "react";
import { Search, Settings, Activity, Plus, RefreshCw, Play, Trash2, Layers, CheckSquare, FileText, ExternalLink } from "lucide-react";
import { ProductListing, ArbitragePair, FilterCondition, ArbitrageSettings, Worklist, SearchTemplate, RecentSearchItem } from "./types";
import { User } from "firebase/auth";
import { initAuth, googleSignIn } from "./lib/firebaseAuth";
import { 
  getUserSettings, 
  saveUserSettings, 
  getUserWorklists, 
  saveUserWorklist, 
  deleteUserWorklist,
  getUserSearchTemplates,
  saveUserSearchTemplate,
  deleteUserSearchTemplate
} from "./lib/firestore";
import { exportToGoogleSheets } from "./lib/googleSheetsApi";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import MainTable from "./components/MainTable";
import StatsRow from "./components/StatsRow";
import SearchModal from "./components/SearchModal";
import SettingsModal from "./components/SettingsModal";
import RoiDrawer from "./components/RoiDrawer";
import OfferModal from "./components/OfferModal";
import BrandModal from "./components/BrandModal";
import GoogleDriveModal from "./components/GoogleDriveModal";
import SmartDiscoveryModal from "./components/SmartDiscoveryModal";
import ArbitrageReasoningModal from "./components/ArbitrageReasoningModal";
import { Sparkles } from "lucide-react";


export default function App() {
  // Master database state
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [pairs, setPairs] = useState<ArbitragePair[]>([]);
  const [activeSearchQuery, setActiveSearchQuery] = useState("słuchawki bezprzewodowe");
  const [isLoading, setIsLoading] = useState(false);
  const [searchDurationSec, setSearchDurationSec] = useState(1.24);

  // Filter & selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [isAndLogic, setIsAndLogic] = useState(true);

  // Sorting
  const [sortField, setSortField] = useState<string>("ROI");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Worklists / Tabs
  const [worklists, setWorklists] = useState<Worklist[]>([
    { id: "worklist-all", name: "Tabela robocza", productIds: [] },
    { id: "worklist-a", name: "Lista A", productIds: [] },
    { id: "worklist-b", name: "Lista B", productIds: [] },
  ]);
  const [activeWorklistId, setActiveWorklistId] = useState("worklist-all");

  // Search templates
  const [searchTemplates, setSearchTemplates] = useState<SearchTemplate[]>([
    {
      id: "preset-headphones",
      name: "🎧 Słuchawki bezprzewodowe (Domyślny)",
      keyword: "słuchawki bezprzewodowe",
      sourcePlatform: "Amazon.de",
      targetPlatform: "Allegro",
      priceMin: 0,
      priceMax: 99999,
      resultsLimit: 5,
      searchSource: "local-db",
    },
    {
      id: "preset-smartwatch",
      name: "⌚ Smartwatche premium (Amazon.de)",
      keyword: "smartwatch garmin apple",
      sourcePlatform: "Amazon.de",
      targetPlatform: "Allegro",
      priceMin: 200,
      priceMax: 3000,
      resultsLimit: 5,
      searchSource: "local-db",
    },
    {
      id: "preset-keyboard",
      name: "⌨️ Akcesoria gamingowe (Ceneo)",
      keyword: "klawiatura mechaniczna",
      sourcePlatform: "Ceneo",
      targetPlatform: "Allegro",
      priceMin: 50,
      priceMax: 600,
      resultsLimit: 10,
      searchSource: "local-db",
    }
  ]);

  // Recent searches history (max 5)
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    const saved = localStorage.getItem("scout_recent_searches");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse scout_recent_searches:", e);
      }
    }
    return [
      {
        id: "recent-1",
        keyword: "pokrowiec na grilla",
        sourcePlatform: "Amazon.de",
        targetPlatform: "Allegro",
        platforms: ["Allegro", "Amazon.de"],
        priceMin: 0,
        priceMax: 500,
        category: "Dom i Ogród",
        timestamp: Date.now() - 100000
      },
      {
        id: "recent-2",
        keyword: "słuchawki bezprzewodowe",
        sourcePlatform: "Amazon.de",
        targetPlatform: "Allegro",
        platforms: ["Allegro", "Amazon.de"],
        priceMin: 0,
        priceMax: 99999,
        category: "Elektronika",
        timestamp: Date.now() - 200000
      },
      {
        id: "recent-3",
        keyword: "smartwatch garmin",
        sourcePlatform: "Amazon.de",
        targetPlatform: "Allegro",
        platforms: ["Allegro", "Amazon.de"],
        priceMin: 200,
        priceMax: 3000,
        category: "Elektronika",
        timestamp: Date.now() - 300000
      }
    ];
  });

  const addRecentSearch = (
    keyword: string,
    platforms: string[] = ["Amazon.de", "Allegro"],
    priceMin: number = 0,
    priceMax: number = 99999,
    category: string = ""
  ) => {
    const cleanKw = keyword.trim();
    if (!cleanKw) return;

    const newItem: RecentSearchItem = {
      id: `recent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      keyword: cleanKw,
      sourcePlatform: platforms.includes("Amazon.de") ? "Amazon.de" : (platforms.includes("Ceneo") ? "Ceneo" : "Allegro"),
      targetPlatform: platforms.includes("Allegro") ? "Allegro" : "Amazon.de",
      platforms,
      priceMin,
      priceMax,
      category,
      timestamp: Date.now(),
    };

    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) =>
          !(
            item.keyword.toLowerCase().trim() === cleanKw.toLowerCase() &&
            item.priceMin === priceMin &&
            item.priceMax === priceMax &&
            (item.category || "") === (category || "")
          )
      );
      const updated = [newItem, ...filtered].slice(0, 5);
      localStorage.setItem("scout_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.setItem("scout_recent_searches", JSON.stringify([]));
  };

  const handleDeleteRecentSearch = (id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("scout_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };


  // Settings
  const [settings, setSettings] = useState<ArbitrageSettings>({
    defaultVatSource: 19,
    defaultVatTarget: 23,
    exchangeRate: 4.31,
    defaultShippingCostEUR: 4.99,
    defaultCommissionPercent: 8,
    useMockSimulation: false,
  });

  // Modal open states
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRoiDrawerOpen, setIsRoiDrawerOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [isSmartDiscoveryOpen, setIsSmartDiscoveryOpen] = useState(false);
  const [isArbitrageReasoningOpen, setIsArbitrageReasoningOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Custom dialogs
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isAddToListOpen, setIsAddToListOpen] = useState(false);

  // Active contextual item state
  const [selectedRowProduct, setSelectedRowProduct] = useState<ProductListing | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState("");
  const [searchSource, setSearchSource] = useState<string>("local-db");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isExportingToSheets, setIsExportingToSheets] = useState(false);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Client-side mock generator in case the server fails or is offline
  const generateClientMockProducts = (
    keyword: string,
    sourcePlatform: string,
    targetPlatform: string,
    priceMin: number,
    priceMax: number,
    resultsLimit: number = 5,
    exchangeRate: number = 4.31,
    category?: string
  ) => {
    const products: any[] = [];
    const pairs: any[] = [];
    const adjectives = ["Profesjonalny", "Bezprzewodowy", "Ergonomiczny", "Szybki", "Premium", "Inteligentny", "Kompaktowy", "Ekologiczny"];
    const categoriesList = ["Elektronika", "Dom i Ogród", "Sport i Turystyka", "Uroda i Zdrowie", "Zabawki", "AGD"];
    const chosenCategory = category && category !== "Wszystkie kategorie" ? category : categoriesList[Math.floor(Math.random() * categoriesList.length)];

    for (let i = 0; i < resultsLimit; i++) {
      const adj = adjectives[i % adjectives.length];
      const itemTitle = `${adj} ${keyword}`;
      const skuBase = (keyword.substring(0, 3).replace(/[^a-zA-Z]/g, "Z") || "SKU").toUpperCase() + "-" + (100 + i + Math.floor(Math.random() * 800));
      
      const basePricePLN = Math.floor(Math.random() * (priceMax - priceMin > 0 ? (priceMax - priceMin) * 0.4 : 500)) + priceMin;
      const buyPricePLN = basePricePLN > 0 ? basePricePLN : 120;
      const buyPriceEUR = +(buyPricePLN / exchangeRate).toFixed(2);

      const roiRandom = Math.floor(Math.random() * 45 + 30); // 30% to 75% ROI
      const shippingPLN = 4.99 * exchangeRate;
      
      const estimatedFeesPLN = buyPricePLN * 0.08 + 1.0;
      const estimatedVatPLN = buyPricePLN * 0.23;
      const targetProfit = Math.round(buyPricePLN * (roiRandom / 100));
      const sellPricePLN = Math.round(buyPricePLN + targetProfit + estimatedFeesPLN + estimatedVatPLN + shippingPLN);

      const sourceId = `dyn-src-${Date.now()}-${i}`;
      const targetId = `dyn-tgt-${Date.now()}-${i}`;
      const matchedEan = `${5900000000000 + Math.floor(100000000 + Math.random() * 900000000)}`;

      const buildUrl = (plat: string, kw: string) => {
        const cleanKw = encodeURIComponent(kw || "produkt");
        if (plat.includes("Amazon")) {
          return `https://www.amazon.de/s?k=${cleanKw}&s=exact-aware-popularity-rank`;
        }
        if (plat === "Allegro") {
          return `https://allegro.pl/listing?string=${cleanKw}&order=p`;
        }
        return `https://www.google.com/search?q=${encodeURIComponent(plat)}+${cleanKw}`;
      };

      const newSource = {
        id: sourceId,
        sku: `${skuBase}-BUY`,
        name: `${itemTitle} (${sourcePlatform} Buy)`,
        platform: sourcePlatform,
        pricePLN: buyPricePLN,
        priceEUR: buyPriceEUR,
        salesPerMonth: Math.floor(Math.random() * 800 + 50),
        rating: +(4 + Math.random() * 0.9).toFixed(1),
        ratingCount: Math.floor(Math.random() * 400 + 15),
        status: i % 3 === 0 ? "Promo" : i % 4 === 0 ? "B2B" : "Aktywny",
        roi: roiRandom,
        asin: `B0${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        ean: matchedEan,
        url: buildUrl(sourcePlatform, keyword),
        category: chosenCategory,
        pairedListingId: targetId
      };

      const newTarget = {
        id: targetId,
        sku: `${skuBase}-SELL`,
        name: `${itemTitle} (${targetPlatform} Sell)`,
        platform: targetPlatform,
        pricePLN: sellPricePLN,
        salesPerMonth: newSource.salesPerMonth,
        rating: newSource.rating,
        ratingCount: newSource.ratingCount,
        status: "Aktywny",
        roi: roiRandom,
        ean: matchedEan,
        url: buildUrl(targetPlatform, keyword),
        category: chosenCategory,
        pairedListingId: sourceId
      };

      const newPair = {
        id: `dyn-pair-${Date.now()}-${i}`,
        sourceId: sourceId,
        targetId: targetId,
        estimatedProfitPLN: targetProfit,
        estimatedROI: roiRandom,
        vatRateSource: 19,
        vatRateTarget: 23,
        shippingCostEUR: 4.99,
        allegroCommissionFeePercent: 8,
        allegroFixedFeePLN: 1.00,
        category: chosenCategory
      };

      products.push(newSource, newTarget);
      pairs.push(newPair);
    }

    return { products, pairs };
  };

  // Search trigger
  const runSearch = async (
    keyword: string,
    sourcePlatform: string = "Amazon.de",
    targetPlatform: string = "Allegro",
    priceMin: number = 0,
    priceMax: number = 99999,
    resultsLimit: number = 5,
    customVars?: {
      exchangeRate: number;
      vatSource: number;
      vatTarget: number;
      shippingCostEUR: number;
      commissionPercent: number;
    },
    category: string = ""
  ) => {
    setIsLoading(true);
    setSearchError(null);
    const startTime = performance.now();

    if (keyword && keyword.trim().length > 0) {
      addRecentSearch(keyword, [sourcePlatform, targetPlatform], priceMin, priceMax, category);
    }

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          sourcePlatform,
          targetPlatform,
          priceMin,
          priceMax,
          resultsLimit,
          category,
          exchangeRate: customVars?.exchangeRate ?? settings.exchangeRate,
          vatSource: customVars?.vatSource ?? settings.defaultVatSource,
          vatTarget: customVars?.vatTarget ?? settings.defaultVatTarget,
          shippingCostEUR: customVars?.shippingCostEUR ?? settings.defaultShippingCostEUR,
          commissionPercent: customVars?.commissionPercent ?? settings.defaultCommissionPercent,
        }),
      });

      if (!response.ok) {
        throw new Error(`Serwer zwrócił status ${response.status}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
      setPairs(data.pairs || []);
      setSearchSource(data.source || "local-db");
      setActiveSearchQuery(keyword);
      setSelectedIds([]); // Reset selection
    } catch (err: any) {
      console.error("Failed to run arbitrage search:", err);
      const polishMsg = err.message || "Błąd połączenia z serwerem";
      setSearchError(`${polishMsg} (uruchomiono tryb bezpiecznej symulacji lokalnej)`);
      
      // Safe offline client-side fallback
      const mockResult = generateClientMockProducts(
        keyword,
        sourcePlatform,
        targetPlatform,
        priceMin,
        priceMax,
        resultsLimit,
        customVars?.exchangeRate ?? settings.exchangeRate,
        category
      );
      setProducts(mockResult.products);
      setPairs(mockResult.pairs);
      setSearchSource("simulation-offline");
      setActiveSearchQuery(keyword);
      setSelectedIds([]);
    } finally {
      const endTime = performance.now();
      setSearchDurationSec(+((endTime - startTime) / 1000).toFixed(2));
      setIsLoading(false);
    }
  };

  // EAN Verification Handler using Gemini AI
  const handleVerifyEan = async (product: ProductListing) => {
    const pairedProduct = products.find(p => p.id === product.pairedListingId) || 
      products.find(p => p.ean && p.ean === product.ean && p.id !== product.id) ||
      product;

    try {
      const res = await fetch("/api/verify-ean", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceProduct: product.platform === "Allegro" ? pairedProduct : product,
          targetProduct: product.platform === "Allegro" ? product : pairedProduct
        })
      });

      if (!res.ok) throw new Error("Błąd podczas weryfikacji EAN.");

      const verificationData = await res.json();

      setProducts(prev => prev.map(p => {
        if (p.id === product.id || p.id === pairedProduct.id) {
          return {
            ...p,
            eanVerification: verificationData
          };
        }
        return p;
      }));

      return verificationData;
    } catch (err) {
      console.error("Weryfikacja EAN nie powiodła się:", err);
      return null;
    }
  };

  const handleVerifyAllEans = async () => {
    const checkedPairedIds = new Set<string>();

    for (const p of products) {
      if (checkedPairedIds.has(p.id)) continue;
      
      const paired = products.find(p2 => p2.id === p.pairedListingId) || p;
      checkedPairedIds.add(p.id);
      checkedPairedIds.add(paired.id);

      await handleVerifyEan(p);
    }
  };

  // Input empty by default on mount
  useEffect(() => {
    runSearch("");
  }, []);

  // Sync state or persist to LocalStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("scout_settings");
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const savedWorklists = localStorage.getItem("scout_worklists");
    if (savedWorklists) setWorklists(JSON.parse(savedWorklists));

    const savedTemplates = localStorage.getItem("scout_search_templates");
    if (savedTemplates) setSearchTemplates(JSON.parse(savedTemplates));
  }, []);

  // Listen to Firebase Auth state for real-time Firestore database sync
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        
        // 1. Fetch user settings from Firestore
        const dbSettings = await getUserSettings(user.uid);
        if (dbSettings) {
          setSettings(dbSettings);
          localStorage.setItem("scout_settings", JSON.stringify(dbSettings));
        } else {
          // If no settings exist in DB yet, initialize them with current state
          try {
            await saveUserSettings(user.uid, user.email || "", settings);
          } catch (err) {
            console.error("Failed to seed initial user settings in Firestore:", err);
          }
        }

        // 2. Fetch worklists from Firestore
        const dbWorklists = await getUserWorklists(user.uid);
        if (dbWorklists.length > 0) {
          // Keep default non-custom lists, but merge or overwrite them with DB lists
          const defaultLists = [
            { id: "worklist-all", name: "Tabela robocza", productIds: [] },
            { id: "worklist-a", name: "Lista A", productIds: [] },
            { id: "worklist-b", name: "Lista B", productIds: [] },
          ];
          
          const customLists = dbWorklists.filter(l => l.isCustom);
          const combined = [...defaultLists];
          
          const dbListA = dbWorklists.find(l => l.id === "worklist-a");
          if (dbListA) combined[1].productIds = dbListA.productIds;
          
          const dbListB = dbWorklists.find(l => l.id === "worklist-b");
          if (dbListB) combined[2].productIds = dbListB.productIds;
          
          const merged = [...combined, ...customLists];
          setWorklists(merged);
          localStorage.setItem("scout_worklists", JSON.stringify(merged));
        }

        // 3. Fetch search templates from Firestore
        const dbTemplates = await getUserSearchTemplates(user.uid);
        if (dbTemplates && dbTemplates.length > 0) {
          const presets = [
            {
              id: "preset-headphones",
              name: "🎧 Słuchawki bezprzewodowe (Domyślny)",
              keyword: "słuchawki bezprzewodowe",
              sourcePlatform: "Amazon.de",
              targetPlatform: "Allegro",
              priceMin: 0,
              priceMax: 99999,
              resultsLimit: 5,
              searchSource: "local-db",
            },
            {
              id: "preset-smartwatch",
              name: "⌚ Smartwatche premium (Amazon.de)",
              keyword: "smartwatch garmin apple",
              sourcePlatform: "Amazon.de",
              targetPlatform: "Allegro",
              priceMin: 200,
              priceMax: 3000,
              resultsLimit: 5,
              searchSource: "local-db",
            },
            {
              id: "preset-keyboard",
              name: "⌨️ Akcesoria gamingowe (Ceneo)",
              keyword: "klawiatura mechaniczna",
              sourcePlatform: "Ceneo",
              targetPlatform: "Allegro",
              priceMin: 50,
              priceMax: 600,
              resultsLimit: 10,
              searchSource: "local-db",
            }
          ];
          const mergedTemplates = [...presets, ...dbTemplates.filter(t => !presets.some(p => p.id === t.id))];
          setSearchTemplates(mergedTemplates);
          localStorage.setItem("scout_search_templates", JSON.stringify(mergedTemplates));
        }
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, [settings]);

  const saveSearchTemplate = async (template: Omit<SearchTemplate, "id"> & { id?: string }) => {
    const newId = template.id || "template-" + Date.now();
    const fullTemplate: SearchTemplate = {
      ...template,
      id: newId,
    };

    setSearchTemplates((prev) => {
      const filtered = prev.filter((t) => t.id !== newId);
      const updated = [...filtered, fullTemplate];
      localStorage.setItem("scout_search_templates", JSON.stringify(updated));
      return updated;
    });

    if (currentUser) {
      try {
        await saveUserSearchTemplate(currentUser.uid, fullTemplate);
      } catch (err) {
        console.error("Failed to save search template to Firestore:", err);
      }
    }
  };

  const deleteSearchTemplate = async (templateId: string) => {
    if (templateId.startsWith("preset-")) {
      alert("Nie można usunąć fabrycznych szablonów domyślnych!");
      return;
    }

    setSearchTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== templateId);
      localStorage.setItem("scout_search_templates", JSON.stringify(updated));
      return updated;
    });

    if (currentUser) {
      try {
        await deleteUserSearchTemplate(currentUser.uid, templateId);
      } catch (err) {
        console.error("Failed to delete search template from Firestore:", err);
      }
    }
  };

  const saveSettings = async (newSettings: ArbitrageSettings) => {
    setSettings(newSettings);
    localStorage.setItem("scout_settings", JSON.stringify(newSettings));
    if (currentUser) {
      try {
        await saveUserSettings(currentUser.uid, currentUser.email || "", newSettings);
      } catch (err) {
        console.error("Failed to sync settings to Firestore:", err);
      }
    }
    // Re-run current search to recalculate values using new settings
    runSearch(activeSearchQuery);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    const newList: Worklist = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      productIds: [],
      isCustom: true,
    };
    const updated = [...worklists, newList];
    setWorklists(updated);
    localStorage.setItem("scout_worklists", JSON.stringify(updated));
    if (currentUser) {
      try {
        await saveUserWorklist(currentUser.uid, newList);
      } catch (err) {
        console.error("Failed to sync new worklist to Firestore:", err);
      }
    }
    setActiveWorklistId(newList.id);
    setNewListName("");
    setIsAddListDialogOpen(false);
  };

  const handleDeleteCustomList = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = worklists.filter((l) => l.id !== id);
    setWorklists(updated);
    localStorage.setItem("scout_worklists", JSON.stringify(updated));
    if (currentUser) {
      try {
        await deleteUserWorklist(currentUser.uid, id);
      } catch (err) {
        console.error("Failed to delete worklist from Firestore:", err);
      }
    }
    setActiveWorklistId("worklist-all");
  };

  const handleImportProducts = (imported: ProductListing[]) => {
    setProducts(imported);
    setPairs([]);
    setSelectedIds([]);
    setActiveWorklistId("worklist-all");
    setSearchSource("Google Drive");
  };

  const handleAddSelectedToWorklist = async (listId: string) => {
    if (selectedIds.length === 0) return;
    let targetList: Worklist | null = null;
    const updated = worklists.map((wl) => {
      if (wl.id === listId) {
        // Prevent duplicates
        const merged = Array.from(new Set([...wl.productIds, ...selectedIds]));
        targetList = { ...wl, productIds: merged };
        return targetList;
      }
      return wl;
    });
    setWorklists(updated);
    localStorage.setItem("scout_worklists", JSON.stringify(updated));
    if (currentUser && targetList) {
      try {
        await saveUserWorklist(currentUser.uid, targetList);
      } catch (err) {
        console.error("Failed to sync updated worklist to Firestore:", err);
      }
    }
    setIsAddToListOpen(false);
    setSelectedIds([]);
  };

  // Sorting Handler
  const handleSort = (field: string) => {
    let actualField = field;
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter Logic execution
  const activeWorklist = worklists.find((wl) => wl.id === activeWorklistId);
  const isAllWorklist = activeWorklistId === "worklist-all";

  // Base list of products after worklist filtration
  const baseProducts = isAllWorklist 
    ? products 
    : products.filter((p) => activeWorklist?.productIds.includes(p.id));

  // Dynamic filter application
  const filteredProducts = baseProducts.filter((p) => {
    if (conditions.length === 0) return true;

    const matches = conditions.map((c) => {
      let propVal: any = "";
      if (c.field === "Nazwa") propVal = p.name;
      else if (c.field === "Cena") propVal = p.pricePLN;
      else if (c.field === "Sprzedaż") propVal = p.salesPerMonth;
      else if (c.field === "Opinie") propVal = p.ratingCount;
      else if (c.field === "Status") propVal = p.status;
      else if (c.field === "ROI") propVal = p.roi;

      if (c.operator === "=") {
        return String(propVal).toLowerCase() === c.value.toLowerCase();
      } else if (c.operator === "<") {
        return Number(propVal) < Number(c.value);
      } else if (c.operator === ">") {
        return Number(propVal) > Number(c.value);
      } else if (c.operator === "~") {
        return String(propVal).toLowerCase().includes(c.value.toLowerCase());
      }
      return true;
    });

    return isAndLogic 
      ? matches.every((m) => m) 
      : matches.some((m) => m);
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let valA: any = a.roi;
    let valB: any = b.roi;

    if (sortField === "Nazwa") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === "Cena") {
      valA = a.pricePLN;
      valB = b.pricePLN;
    } else if (sortField === "Sprzedaż") {
      valA = a.salesPerMonth;
      valB = b.salesPerMonth;
    } else if (sortField === "Opinie") {
      valA = a.rating;
      valB = b.rating;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // KPI computations for Stats Row
  const totalResultsCount = sortedProducts.length;
  const selectedCount = selectedIds.filter(id => sortedProducts.some(p => p.id === id)).length;
  const activeProductsWithRoi = sortedProducts.filter((p) => p.roi > 0);
  const avgRoi = activeProductsWithRoi.length > 0 
    ? Math.round(activeProductsWithRoi.reduce((acc, p) => acc + p.roi, 0) / activeProductsWithRoi.length)
    : 0;
  const worklistsCount = worklists.length;

  // Row Action dispatcher
  const handleRowAction = (actionType: string, product: ProductListing) => {
    setSelectedRowProduct(product);
    if (actionType === "ROI") {
      setIsRoiDrawerOpen(true);
    } else if (actionType === "Detale") {
      // Open brand modal or detail overview
      setSelectedBrandName(product.name.split(" ")[0]);
      setIsBrandModalOpen(true);
    } else if (actionType === "Oferta") {
      setIsOfferModalOpen(true);
    } else if (actionType === "RozumowanieAI") {
      setIsArbitrageReasoningOpen(true);
    }
  };

  // Direct Google Sheets Export action
  const handleExportToSheetsDirectly = async (productsToExport: ProductListing[]) => {
    if (productsToExport.length === 0) {
      alert("Brak produktów do eksportu!");
      return;
    }

    let currentToken = accessToken;
    if (!currentUser || !currentToken) {
      const confirmLogin = window.confirm(
        "Aby wyeksportować dane bezpośrednio do Arkuszy Google, wymagane jest połączenie z kontem Google. Czy chcesz zalogować się teraz?"
      );
      if (!confirmLogin) return;

      try {
        setIsExportingToSheets(true);
        const result = await googleSignIn();
        if (result) {
          setCurrentUser(result.user);
          setAccessToken(result.accessToken);
          currentToken = result.accessToken;
        } else {
          setIsExportingToSheets(false);
          return;
        }
      } catch (err: any) {
        console.error("Direct google sign in failed:", err);
        alert(`Błąd logowania: ${err.message || err}`);
        setIsExportingToSheets(false);
        return;
      }
    }

    if (!currentToken) {
      alert("Brak autoryzacji do konta Google. Spróbuj zalogować się ponownie.");
      return;
    }

    setIsExportingToSheets(true);
    setExportedSheetUrl(null);
    try {
      const title = `Scout Wyeksportowane - ${new Date().toLocaleDateString("pl-PL")} ${new Date().toLocaleTimeString("pl-PL")}`;
      const result = await exportToGoogleSheets(currentToken, title, productsToExport);
      setExportedSheetUrl(result.spreadsheetUrl);
    } catch (err: any) {
      console.error("Sheets export failed:", err);
      alert(`Błąd podczas eksportu do Google Sheets: ${err.message || err}`);
    } finally {
      setIsExportingToSheets(false);
    }
  };

  // Group actions dispatcher
  const handleGroupAction = (actionType: string) => {
    if (actionType === "EKSPORTUJ_SHEETS") {
      const selectedProducts = products.filter((p) => selectedIds.includes(p.id));
      handleExportToSheetsDirectly(selectedProducts);
      return;
    }

    if (selectedIds.length === 0) {
      alert("Najpierw zaznacz przynajmniej jeden produkt z tabeli!");
      return;
    }

    // Grab first selected product as the reference context
    const firstSelectedProduct = products.find((p) => selectedIds.includes(p.id));
    if (!firstSelectedProduct) return;

    if (actionType === "DODAJ DO LISTY") {
      setIsAddToListOpen(true);
    } else if (actionType === "ANALIZUJ ROI") {
      setSelectedRowProduct(firstSelectedProduct);
      setIsRoiDrawerOpen(true);
    } else if (actionType === "UTWÓRZ OFERTĘ") {
      setSelectedRowProduct(firstSelectedProduct);
      setIsOfferModalOpen(true);
    } else if (actionType === "ANALIZUJ BRAND") {
      const brand = firstSelectedProduct.name.split(" ")[0];
      setSelectedBrandName(brand);
      setIsBrandModalOpen(true);
    } else if (actionType === "POBIERZ DETALE" || actionType === "SZUKAJ PODOBNE" || actionType === "NAJLEPSZA OFERTA") {
      // Context simulation or automated alert
      alert(`Wykonywanie akcji grupowej "${actionType}" dla ${selectedIds.length} zaznaczonych produktów...`);
    }
  };

  // Toolbar Actions on selected
  const handleToolbarExecute = (actionType: string) => {
    handleGroupAction(actionType);
  };

  const handleBulkSelect = (type: string) => {
    if (type === "ALL") {
      setSelectedIds(products.map((p) => p.id));
    } else if (type === "NONE") {
      setSelectedIds([]);
    } else if (type === "HIGH_ROI") {
      const filtered = products.filter((p) => p.roi >= 45).map((p) => p.id);
      setSelectedIds(filtered);
    } else if (type === "AMAZON") {
      const filtered = products.filter((p) => p.platform === "Amazon.de").map((p) => p.id);
      setSelectedIds(filtered);
    } else if (type === "ALLEGRO") {
      const filtered = products.filter((p) => p.platform === "Allegro").map((p) => p.id);
      setSelectedIds(filtered);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f1115] text-[#e2e8f0] overflow-hidden">
      
      {/* App Header */}
      <Header 
        onOpenSearch={() => setIsSearchModalOpen(true)} 
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenSmartDiscovery={() => setIsSmartDiscoveryOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        activeSearchQuery={activeSearchQuery}
        currentUser={currentUser}
      />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        
        {/* Left Sidebar inside responsive off-canvas / static flex layout */}
        <div 
          className={`
            fixed inset-y-0 left-0 z-40 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex shrink-0 h-full md:h-auto
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <Sidebar 
            onSearch={(kw, pl, min, max, cat) => {
              const src = pl.includes("Amazon.de") ? "Amazon.de" : (pl.includes("Ceneo") ? "Ceneo" : "Allegro");
              const tgt = (pl.includes("Allegro") && src !== "Allegro") ? "Allegro" : "Amazon.de";
              runSearch(kw, src, tgt, min, max, 5, undefined, cat);
              setIsMobileSidebarOpen(false); // auto-close on search
            }}
            onAddCondition={(cond) => setConditions([...conditions, cond])}
            onRemoveCondition={(id) => setConditions(conditions.filter((c) => c.id !== id))}
            onClearConditions={() => setConditions([])}
            onToggleLogic={() => setIsAndLogic(!isAndLogic)}
            conditions={conditions}
            isAndLogic={isAndLogic}
            onGroupAction={handleGroupAction}
            selectedCount={selectedCount}
            searchTemplates={searchTemplates}
            onSaveTemplate={saveSearchTemplate}
            onDeleteTemplate={deleteSearchTemplate}
            recentSearches={recentSearches}
            onClearRecentSearches={handleClearRecentSearches}
            onDeleteRecentSearch={handleDeleteRecentSearch}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {/* Mobile Sidebar Backdrop Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Center content / Main Board */}
        <main className="main-content flex-1 p-3 sm:p-6 flex flex-col min-h-0 overflow-y-auto">
          
          {/* Active Search Query & Direct Marketplace Search Shortcuts */}
          <div className="bg-sidebar-dark border border-brand-dark rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 font-sans">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="p-1.5 bg-brand-blue/10 border border-brand-blue/30 rounded-lg text-brand-blue">
                <Search className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Wyszukiwarka Produktowa Arbitrażu
                </span>
                <span className="font-semibold text-slate-100 text-xs">
                  {activeSearchQuery ? (
                    <>Aktywna fraza: <span className="text-brand-blue font-bold">"{activeSearchQuery}"</span></>
                  ) : (
                    "Wyszukaj okazje rynkowe na Allegro i Amazon.de"
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end font-mono text-[11px]">
              <a
                href={`https://allegro.pl/listing?string=${encodeURIComponent(activeSearchQuery || "słuchawki bezprzewodowe")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer decoration-none"
              >
                <span>🛒 Allegro Listing</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={`https://www.amazon.de/s?k=${encodeURIComponent(activeSearchQuery || "słuchawki bezprzewodowe")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer decoration-none"
              >
                <span>📦 Amazon.de Search</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Stats KPI Header Row */}
          <StatsRow 
            totalResults={totalResultsCount}
            selectedCount={selectedCount}
            avgRoi={avgRoi}
            worklistsCount={worklistsCount}
          />

          {/* AI Smart Discovery Banner */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-emerald-500/10 via-[#131620] to-brand-blue/10 border border-brand-dark rounded-xl p-4 mb-4 gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Inteligentna rekomendacja niszy rynkowej
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {activeSearchQuery 
                    ? `Zbadaj pozycję rynkową i powiązane podkategorie dla frazy "${activeSearchQuery}" za pomocą algorytmu Gemini.`
                    : "Wykrywaj najbardziej zyskowne kategorie i gorące trendy importowe z Amazon.de na Allegro."
                  }
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsSmartDiscoveryOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0f1115] text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/15 active:scale-95 border-0 hover:translate-x-0.5"
            >
              <Sparkles className="w-4 h-4 text-[#0f1115]" />
              <span>{activeSearchQuery ? "Analizuj Aktywną Frazę" : "Odkryj Trendy Teraz"}</span>
            </button>
          </div>

          {exportedSheetUrl && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-400 text-xs shadow-lg shrink-0 animate-pulse">
              <div className="flex items-center gap-2.5">
                <div className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span>Pomyślnie wyeksportowano produkty do Twojego Arkusza Google!</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a 
                  href={exportedSheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-md flex items-center gap-1.5 decoration-none cursor-pointer text-center justify-center text-[11px]"
                >
                  <span>Otwórz Arkusz ↗</span>
                </a>
                <button 
                  onClick={() => setExportedSheetUrl(null)} 
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border-0 text-[11px] font-semibold"
                >
                  Ukryj
                </button>
              </div>
            </div>
          )}

          {searchError && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-400 text-xs shadow-lg shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-sm">⚠️</span>
                <span>Nie udało się pobrać danych: {searchError}</span>
              </div>
              <button 
                onClick={() => setSearchError(null)} 
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border-0 text-[11px] font-semibold"
              >
                Zamknij
              </button>
            </div>
          )}

          {/* Table Toolbar / Control Panel */}
          <div className="table-toolbar flex flex-col sm:flex-row sm:items-center justify-between border border-brand-dark bg-sidebar-dark rounded-xl px-5 py-3 mb-4 gap-3 shrink-0">
            
            {/* Tabs List */}
            <div className="toolbar-section flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <div className="tab-switcher flex bg-bg-dark border border-brand-dark p-0.5 rounded-lg">
                {worklists.map((wl) => {
                  const isActive = activeWorklistId === wl.id;
                  return (
                    <div 
                      key={wl.id}
                      className="relative group flex items-center"
                    >
                      <button
                        onClick={() => setActiveWorklistId(wl.id)}
                        className={`tab-btn cursor-pointer px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 border-0 ${
                          isActive 
                            ? "bg-brand-blue text-white shadow-md font-bold" 
                            : "text-[#8a94a6] hover:text-slate-200 bg-transparent"
                        }`}
                      >
                        <span>{wl.name}</span>
                        {wl.productIds.length > 0 && (
                          <span className={`text-[9px] font-mono font-bold px-1 rounded-full ${isActive ? "bg-blue-800 text-blue-200" : "bg-bg-dark text-slate-400"}`}>
                            {wl.productIds.length}
                          </span>
                        )}
                      </button>
                      
                      {/* Delete Custom List X button */}
                      {wl.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomList(wl.id, e)}
                          className="absolute -top-1 -right-1 hidden group-hover:flex bg-brand-red/80 hover:bg-brand-red text-white text-[8px] font-bold w-3.5 h-3.5 items-center justify-center rounded-full border border-brand-red cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setIsAddListDialogOpen(true)}
                className="px-3 py-1.5 bg-sidebar-dark border border-brand-dark rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span>Nowa</span>
              </button>
            </div>

            <div className="hidden sm:block toolbar-sep w-[1px] h-6 bg-brand-dark" />

            {/* Mass Selection & Action Control Dropdown */}
            <div className="toolbar-section flex flex-col md:flex-row items-start md:items-center gap-4 ml-auto text-xs w-full sm:w-auto">
              
              {/* Mass Selection Options */}
              <div className="flex flex-wrap items-center gap-1 bg-[#15181e] border border-brand-dark rounded-lg p-1 text-[10px] font-mono">
                <span className="text-[#8a94a6] font-bold px-1.5 uppercase text-[9px]">Zaznacz masowo:</span>
                <button
                  type="button"
                  onClick={() => handleBulkSelect("ALL")}
                  className="px-2 py-1 rounded bg-sidebar-dark hover:bg-slate-800 text-slate-300 font-bold transition-all cursor-pointer border-0"
                >
                  Wszystkie
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelect("HIGH_ROI")}
                  className="px-2 py-1 rounded bg-sidebar-dark hover:bg-slate-800 text-brand-green font-bold transition-all cursor-pointer border-0"
                  title="Produkty o ROI >= 45%"
                >
                  High ROI
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelect("AMAZON")}
                  className="px-2 py-1 rounded bg-sidebar-dark hover:bg-slate-800 text-brand-blue font-bold transition-all cursor-pointer border-0"
                  title="Produkty z Amazon.de"
                >
                  Amazon.de
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelect("ALLEGRO")}
                  className="px-2 py-1 rounded bg-sidebar-dark hover:bg-slate-800 text-brand-yellow font-bold transition-all cursor-pointer border-0"
                  title="Produkty z Allegro"
                >
                  Allegro
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSelect("NONE")}
                  className="px-2 py-1 rounded bg-sidebar-dark hover:bg-slate-800 text-rose-400 font-bold transition-all cursor-pointer border-0"
                >
                  Brak
                </button>
              </div>

              {/* Bulk Action Dropdown */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#8a94a6] text-[10px] hidden lg:inline">
                  Wybrane ({selectedCount}):
                </span>
                <select
                  disabled={selectedCount === 0}
                  onChange={(e) => {
                    const action = e.target.value;
                    if (action) {
                      handleToolbarExecute(action);
                      e.target.value = ""; // reset dropdown
                    }
                  }}
                  className="bg-sidebar-dark text-slate-200 border border-brand-dark rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer focus:outline-hidden disabled:opacity-45 disabled:cursor-not-allowed font-mono transition-all"
                >
                  <option value="">-- Wybierz akcję dla zaznaczonych ({selectedCount}) --</option>
                  <option value="ANALIZUJ ROI">📈 Analiza ROI (Kalkulator)</option>
                  <option value="UTWÓRZ OFERTĘ">📄 Utwórz Ofertę Allegro AI</option>
                  <option value="ANALIZUJ BRAND">🏷️ Analiza Ryzyka Brandu</option>
                  <option value="EKSPORTUJ_SHEETS">📊 Eksportuj do Google Sheets</option>
                  <option value="DODAJ DO LISTY">📁 Dodaj do Listy Roboczej</option>
                  <option value="POBIERZ DETALE">📥 Pobierz Detale Techniczne</option>
                  <option value="SZUKAJ PODOBNE">🔎 Wyszukaj Podobne Oferty</option>
                  <option value="NAJLEPSZA OFERTA">💎 Znajdź Najlepszą Ofertę</option>
                </select>
              </div>
            </div>

          </div>

          {/* Table Container */}
          {isLoading ? (
            <div className="flex-1 bg-sidebar-dark border border-brand-dark rounded-xl flex flex-col items-center justify-center space-y-4 shadow-inner">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
                <Search className="w-5 h-5 text-brand-blue absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="flex flex-col items-center space-y-1.5">
                <span className="font-semibold text-slate-300">Przeszukiwanie rynków zagranicznych...</span>
                <span className="text-xs text-slate-500 font-mono">Synchronizacja Amazon.de ⇄ Allegro w czasie rzeczywistym</span>
              </div>
            </div>
          ) : (
            <MainTable 
              products={sortedProducts}
              selectedIds={selectedIds}
              onToggleSelect={(id) => {
                if (selectedIds.includes(id)) {
                  setSelectedIds(selectedIds.filter((x) => x !== id));
                } else {
                  setSelectedIds([...selectedIds, id]);
                }
              }}
              onToggleSelectAll={() => {
                if (selectedIds.length === sortedProducts.length) {
                  setSelectedIds([]);
                } else {
                  setSelectedIds(sortedProducts.map((p) => p.id));
                }
              }}
              onRowAction={handleRowAction}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onVerifyEan={handleVerifyEan}
              onVerifyAllEans={handleVerifyAllEans}
            />
          )}

          {/* Table Bottom bar */}
          <div className="bottom-bar bg-sidebar-dark border border-brand-dark rounded-xl px-5 py-3 mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#8a94a6] gap-3 shrink-0 font-mono">
            <div className="bottom-info flex flex-wrap gap-4 items-center">
              <span>Pokazano: <span className="text-white font-bold">{totalResultsCount} / {products.length}</span></span>
              <span>Zaznaczono: <span className="text-brand-blue font-bold">{selectedCount}</span></span>
              <span>Czas: <span className="text-white font-bold">{searchDurationSec}s</span></span>
              <span>Źródła: <span className="text-slate-300 font-semibold">Allegro, Amazon DE, Amazon PL</span></span>
              
              {searchSource === "grounded-ai" && (
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live AI Grounding
                </span>
              )}
              {searchSource === "non-grounded-ai" && (
                <span className="px-2.5 py-0.5 rounded bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase border border-brand-blue/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                  AI Synthesis
                </span>
              )}
              {searchSource === "simulation" && (
                <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase border border-amber-500/20 flex items-center gap-1" title="Automatyczny tryb symulacji z powodu limitów taryfowych lub przeciążenia API Gemini">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Simulated Fallback
                </span>
              )}
              {searchSource === "local-db" && (
                <span className="px-2.5 py-0.5 rounded bg-slate-500/10 text-slate-400 text-[10px] font-bold uppercase border border-slate-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Local Cache
                </span>
              )}
            </div>

            {/* Pagination simulator */}
            <div className="pagination flex items-center gap-1">
              <button className="page-btn bg-bg-dark border border-brand-dark hover:bg-slate-800 text-slate-300 px-2 py-1 rounded cursor-pointer font-mono">‹</button>
              <button className="page-btn bg-brand-blue text-white border border-brand-blue px-2.5 py-1 rounded cursor-pointer font-bold font-mono">1</button>
              <button className="page-btn bg-bg-dark border border-brand-dark hover:bg-slate-800 text-slate-400 px-2 py-1 rounded cursor-pointer font-mono">2</button>
              <button className="page-btn bg-bg-dark border border-brand-dark hover:bg-slate-800 text-slate-400 px-2 py-1 rounded cursor-pointer font-mono">3</button>
              <span className="text-slate-600 px-1 font-mono">…</span>
              <button className="page-btn bg-bg-dark border border-brand-dark hover:bg-slate-800 text-slate-400 px-2.5 py-1 rounded cursor-pointer font-mono">25</button>
              <button className="page-btn bg-bg-dark border border-brand-dark hover:bg-slate-800 text-slate-300 px-2 py-1 rounded cursor-pointer font-mono">›</button>
            </div>
          </div>

        </main>
      </div>

      {/* MODALS & OVERLAYS */}
      
      {/* Search Popup Modal */}
      <SearchModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialSettings={settings}
        searchTemplates={searchTemplates}
        onSaveTemplate={saveSearchTemplate}
        onDeleteTemplate={deleteSearchTemplate}
        onSearch={(params) => runSearch(
          params.keyword,
          params.sourcePlatform,
          params.targetPlatform,
          params.priceMin,
          params.priceMax,
          params.resultsLimit,
          {
            exchangeRate: params.exchangeRate,
            vatSource: params.vatSource,
            vatTarget: params.vatTarget,
            shippingCostEUR: params.shippingCostEUR,
            commissionPercent: params.commissionPercent
          },
          params.category
        )}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      {/* ROI Calculator Drawer */}
      <RoiDrawer 
        isOpen={isRoiDrawerOpen}
        onClose={() => {
          setIsRoiDrawerOpen(false);
          setSelectedRowProduct(null);
        }}
        product={selectedRowProduct}
        settings={settings}
      />

      {/* Offer Creator Modal */}
      <OfferModal 
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false);
          setSelectedRowProduct(null);
        }}
        product={selectedRowProduct}
      />

      {/* Brand Analysis Modal */}
      <BrandModal 
        isOpen={isBrandModalOpen}
        onClose={() => {
          setIsBrandModalOpen(false);
          setSelectedBrandName("");
        }}
        brandName={selectedBrandName}
      />

      {/* Google Drive Integration Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        currentProducts={products}
        selectedProducts={products.filter((p) => selectedIds.includes(p.id))}
        onImportProducts={handleImportProducts}
      />

      {/* DIALOG: Create New Worklist */}
      {isAddListDialogOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-sidebar-dark border border-brand-dark rounded-xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h4 className="font-semibold text-sm uppercase font-mono tracking-wider text-slate-200">
              Tworzenie nowej listy
            </h4>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Nazwa listy roboczej:</label>
              <input 
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="np. Słuchawki Premium, Lego Okazje..."
                className="w-full bg-bg-dark border border-brand-dark rounded px-3 py-2 text-xs text-white focus:outline-hidden"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateList();
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button 
                onClick={() => setIsAddListDialogOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-all cursor-pointer bg-transparent border-0"
              >
                Anuluj
              </button>
              <button 
                onClick={handleCreateList}
                className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded transition-all cursor-pointer border-0"
              >
                Utwórz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: Add Selected Products to worklist */}
      {isAddToListOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-sidebar-dark border border-brand-dark rounded-xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h4 className="font-semibold text-sm uppercase font-mono tracking-wider text-slate-200">
              Dodaj zaznaczone ({selectedCount}) do listy
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {worklists.filter(wl => wl.id !== "worklist-all").map((wl) => (
                <button
                  key={wl.id}
                  onClick={() => handleAddSelectedToWorklist(wl.id)}
                  className="w-full text-left bg-bg-dark border border-brand-dark hover:bg-slate-800 text-slate-300 p-2.5 rounded-lg text-xs font-semibold transition-all flex justify-between items-center cursor-pointer"
                >
                  <span>{wl.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">({wl.productIds.length} produktów)</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2 text-xs font-semibold">
              <button 
                onClick={() => setIsAddToListOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-all cursor-pointer bg-transparent border-0"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Discovery Trend Analysis Modal */}
      <SmartDiscoveryModal
        isOpen={isSmartDiscoveryOpen}
        onClose={() => setIsSmartDiscoveryOpen(false)}
        activeKeyword={activeSearchQuery || undefined}
        onSearchKeyword={(keyword) => {
          runSearch(keyword, "Amazon.de", "Allegro", 0, 99999);
        }}
      />

      {/* Arbitrage Reasoning Modal (Gemini AI) */}
      <ArbitrageReasoningModal
        isOpen={isArbitrageReasoningOpen}
        onClose={() => setIsArbitrageReasoningOpen(false)}
        product={selectedRowProduct}
        settings={settings}
      />

    </div>
  );
}
