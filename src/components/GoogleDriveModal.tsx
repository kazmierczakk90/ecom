import React, { useState, useEffect } from "react";
import { X, Cloud, Download, Upload, Trash2, LogOut, AlertTriangle, CheckCircle, RefreshCw, FileText, CheckSquare, PlusCircle } from "lucide-react";
import { User } from "firebase/auth";
import { googleSignIn, logout, initAuth, getAccessToken } from "../lib/firebaseAuth";
import { listDriveFiles, uploadFileToDrive, downloadFileContent, deleteDriveFile, DriveFile } from "../lib/googleDriveApi";
import { exportToGoogleSheets } from "../lib/googleSheetsApi";
import { ProductListing } from "../types";

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProducts: ProductListing[];
  selectedProducts: ProductListing[];
  onImportProducts: (imported: ProductListing[]) => void;
}

export default function GoogleDriveModal({
  isOpen,
  onClose,
  currentProducts,
  selectedProducts,
  onImportProducts,
}: GoogleDriveModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Files list
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [exportedSheetUrl, setExportedSheetUrl] = useState<string | null>(null);

  // Initialize and check current auth state
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingAuth(true);
    // Listen to Firebase Auth state
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsLoadingAuth(false);
        fetchFiles(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoadingAuth(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const fetchFiles = async (accessToken: string) => {
    setIsLoadingFiles(true);
    try {
      const driveFiles = await listDriveFiles(accessToken);
      setFiles(driveFiles);
    } catch (err) {
      console.error("Error loading Google Drive files:", err);
      showStatus("Nie udało się pobrać listy plików z Google Drive.", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const showStatus = (text: string, type: "success" | "error" | "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  const handleLogin = async () => {
    setIsActionLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showStatus("Zalogowano pomyślnie z Google Drive!", "success");
        fetchFiles(result.accessToken);
      }
    } catch (err) {
      console.error("Login failed:", err);
      showStatus("Logowanie z Google nie powiodło się.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsActionLoading(true);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setFiles([]);
      showStatus("Wylogowano z konta Google.", "info");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRefreshFiles = () => {
    if (token) {
      fetchFiles(token);
    }
  };

  // Convert products list to standard comma separated values
  const generateCsvContent = (items: ProductListing[]): string => {
    if (items.length === 0) return "";
    const headers = [
      "ID",
      "SKU",
      "Name",
      "Platform",
      "PricePLN",
      "PriceEUR",
      "OriginalPricePLN",
      "SalesPerMonth",
      "Rating",
      "RatingCount",
      "Status",
      "ROI",
      "ASIN",
      "EAN",
      "URL",
      "Category",
      "PairedListingId",
    ];
    
    const csvRows = [headers.join(",")];
    
    for (const p of items) {
      const row = [
        p.id,
        p.sku || "",
        `"${(p.name || "").replace(/"/g, '""')}"`,
        p.platform,
        p.pricePLN,
        p.priceEUR || "",
        p.originalPricePLN || "",
        p.salesPerMonth || 0,
        p.rating || 0,
        p.ratingCount || 0,
        p.status || "Aktywny",
        p.roi || 0,
        p.asin || "",
        p.ean || "",
        p.url || "",
        p.category || "",
        p.pairedListingId || "",
      ];
      csvRows.push(row.join(","));
    }
    return csvRows.join("\n");
  };

  const handleExportSelected = async () => {
    if (!token || selectedProducts.length === 0) return;
    setIsActionLoading(true);
    setExportedSheetUrl(null);
    try {
      const csvContent = generateCsvContent(selectedProducts);
      const fileName = `product_scout_selected_${Date.now()}.csv`;
      await uploadFileToDrive(token, fileName, csvContent, "text/csv");
      showStatus(`Pomyślnie wyeksportowano ${selectedProducts.length} produktów do pliku ${fileName}!`, "success");
      fetchFiles(token);
    } catch (err) {
      console.error("Export failed:", err);
      showStatus("Eksport do Google Drive zakończył się niepowodzeniem.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportAll = async () => {
    if (!token || currentProducts.length === 0) return;
    setIsActionLoading(true);
    setExportedSheetUrl(null);
    try {
      const csvContent = generateCsvContent(currentProducts);
      const fileName = `product_scout_all_${Date.now()}.csv`;
      await uploadFileToDrive(token, fileName, csvContent, "text/csv");
      showStatus(`Pomyślnie wyeksportowano wszystkie produkty (${currentProducts.length}) do pliku ${fileName}!`, "success");
      fetchFiles(token);
    } catch (err) {
      console.error("Export failed:", err);
      showStatus("Eksport do Google Drive zakończył się niepowodzeniem.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSheetsExportSelected = async () => {
    if (!token || selectedProducts.length === 0) return;
    setIsActionLoading(true);
    setExportedSheetUrl(null);
    try {
      const title = `Scout Wybrane - ${new Date().toLocaleDateString("pl-PL")} ${new Date().toLocaleTimeString("pl-PL")}`;
      const result = await exportToGoogleSheets(token, title, selectedProducts);
      setExportedSheetUrl(result.spreadsheetUrl);
      showStatus(`Pomyślnie utworzono Arkusz Google i wyeksportowano ${selectedProducts.length} produktów!`, "success");
    } catch (err: any) {
      console.error("Sheets export failed:", err);
      showStatus(`Eksport do Google Sheets zakończył się niepowodzeniem: ${err.message || err}`, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSheetsExportAll = async () => {
    if (!token || currentProducts.length === 0) return;
    setIsActionLoading(true);
    setExportedSheetUrl(null);
    try {
      const title = `Scout Wszystkie - ${new Date().toLocaleDateString("pl-PL")} ${new Date().toLocaleTimeString("pl-PL")}`;
      const result = await exportToGoogleSheets(token, title, currentProducts);
      setExportedSheetUrl(result.spreadsheetUrl);
      showStatus(`Pomyślnie utworzono Arkusz Google i wyeksportowano wszystkie produkty (${currentProducts.length})!`, "success");
    } catch (err: any) {
      console.error("Sheets export failed:", err);
      showStatus(`Eksport do Google Sheets zakończył się niepowodzeniem: ${err.message || err}`, "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleImportFile = async (fileId: string, fileName: string) => {
    if (!token) return;
    setIsActionLoading(true);
    try {
      const fileContent = await downloadFileContent(token, fileId);
      
      // Parse CSV
      const lines = fileContent.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length < 2) {
        showStatus("Błędny format pliku CSV lub brak rekordów.", "error");
        return;
      }

      const importedList: ProductListing[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Custom simple regex to parse CSV with quotes correctly
        const regex = /(?:,|\n|^)(?:"([^"]*(?:""[^"]*)*)"|([^",\n]*))/g;
        const matches = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          matches.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
        }
        if (matches.length > 0 && matches[matches.length - 1] === undefined) {
          matches.pop();
        }

        if (matches.length >= 4) {
          // Parse status safely to the allowed status values
          let parsedStatus: "Aktywny" | "Promo" | "B2B" | "Braki" | "Nowy" = "Aktywny";
          const rawStatus = matches[10];
          if (rawStatus === "Promo" || rawStatus === "B2B" || rawStatus === "Braki" || rawStatus === "Nowy" || rawStatus === "Aktywny") {
            parsedStatus = rawStatus as any;
          }

          // Parse platform safely to the allowed values
          let parsedPlatform: "Allegro" | "Amazon.de" | "Ceneo" | "eBay" | "Amazon.pl" = "Allegro";
          const rawPlatform = matches[3];
          if (rawPlatform === "Amazon.de" || rawPlatform === "Ceneo" || rawPlatform === "eBay" || rawPlatform === "Amazon.pl" || rawPlatform === "Allegro") {
            parsedPlatform = rawPlatform as any;
          }

          importedList.push({
            id: matches[0] || `imported-${Date.now()}-${i}`,
            sku: matches[1] || "",
            name: matches[2] || "Zaimportowany produkt",
            platform: parsedPlatform,
            pricePLN: Number(matches[4]) || 0,
            priceEUR: matches[5] ? Number(matches[5]) : undefined,
            originalPricePLN: matches[6] ? Number(matches[6]) : undefined,
            salesPerMonth: Number(matches[7]) || 0,
            rating: Number(matches[8]) || 5.0,
            ratingCount: Number(matches[9]) || 0,
            status: parsedStatus,
            roi: Number(matches[11]) || 0,
            asin: matches[12] || "",
            ean: matches[13] || "",
            url: matches[14] || "",
            category: matches[15] || "Inne",
            pairedListingId: matches[16] || undefined,
          });
        }
      }

      if (importedList.length > 0) {
        onImportProducts(importedList);
        showStatus(`Pomyślnie zaimportowano ${importedList.length} produktów z pliku ${fileName}!`, "success");
        onClose();
      } else {
        showStatus("Nie udało się sparsować żadnych produktów z pliku.", "error");
      }
    } catch (err) {
      console.error("Import failed:", err);
      showStatus("Błąd odczytu pliku z Google Drive.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // MANDATORY USER CONFIRMATION before deleting user's files on Google Drive!
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!token) return;
    const confirmed = window.confirm(
      `Czy na pewno chcesz trwale USUNĄĆ plik "${fileName}" ze swojego Dysku Google? Tej operacji nie można cofnąć.`
    );
    if (!confirmed) return;

    setIsActionLoading(true);
    try {
      await deleteDriveFile(token, fileId);
      showStatus(`Pomyślnie usunięto plik "${fileName}".`, "info");
      fetchFiles(token);
    } catch (err) {
      console.error("Failed to delete file:", err);
      showStatus("Nie udało się usunąć pliku z Google Drive.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all font-sans">
      <div className="bg-sidebar-dark border border-brand-dark rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark bg-sidebar-dark">
          <div className="flex items-center gap-2.5">
            <Cloud className="w-5 h-5 text-brand-blue animate-bounce" />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-white">
              Integracja z Chmurą Google (Drive & Sheets)
            </h3>
          </div>
          <button 
            id="close-drive-modal"
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          
          {/* Status Toast Banner inside modal */}
          {statusMessage && (
            <div className={`p-3.5 rounded-lg border text-xs flex flex-col gap-2.5 animate-fade-in ${
              statusMessage.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : statusMessage.type === "error"
                ? "bg-brand-red/10 border-brand-red/20 text-brand-red"
                : "bg-brand-blue/10 border-brand-blue/20 text-brand-blue"
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{statusMessage.text}</span>
              </div>
              {exportedSheetUrl && statusMessage.type === "success" && (
                <div className="mt-1 pl-6">
                  <a
                    href={exportedSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all font-semibold decoration-none cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Otwórz Arkusz Google ↗</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Authentication State */}
          {isLoadingAuth ? (
            <div className="h-[200px] flex flex-col items-center justify-center space-y-3 bg-bg-dark border border-brand-dark rounded-lg">
              <RefreshCw className="w-6 h-6 text-brand-blue animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Inicjalizacja Google API...</span>
            </div>
          ) : !user ? (
            /* Sign-in state */
            <div className="p-8 text-center bg-bg-dark border border-brand-dark rounded-lg flex flex-col items-center justify-center space-y-5">
              <div className="bg-brand-blue/10 p-4 rounded-full border border-brand-blue/20">
                <Cloud className="w-10 h-10 text-brand-blue" />
              </div>
              <div className="max-w-md space-y-2">
                <h4 className="text-base font-bold text-slate-200">Zapisuj analizy bezpośrednio w chmurze</h4>
                <p className="text-xs text-slate-400">
                  Połącz aplikację z kontem Google, aby bezpiecznie eksportować wyszukane pary produktów do formatu CSV na swoim Dysku Google lub importować gotowe wykazy produktów do ponownej analizy.
                </p>
              </div>

              {/* Official standard google button style translated to Tailwind */}
              <button
                id="google-signin-btn"
                onClick={handleLogin}
                disabled={isActionLoading}
                className="gsi-material-button relative flex items-center gap-3 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold border border-slate-300 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span>Zaloguj się przez Google</span>
              </button>
            </div>
          ) : (
            /* Logged-in state */
            <div className="space-y-6">
              
              {/* Profile Block */}
              <div className="flex flex-col sm:flex-row items-center justify-between bg-bg-dark p-4 rounded-lg border border-brand-dark gap-4">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-brand-dark" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center font-bold text-brand-blue font-mono">
                      {user.displayName?.[0] || user.email?.[0] || "?"}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">DYSK POŁĄCZONY</span>
                    <h4 className="text-sm font-bold text-slate-200">{user.displayName || "Google User"}</h4>
                    <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-red/30 hover:bg-brand-red/10 text-brand-red text-xs font-semibold cursor-pointer bg-transparent transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Wyloguj się</span>
                </button>
              </div>

              {/* Export Panel */}
              <div className="space-y-4">
                <div className="border-b border-brand-dark pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-slate-400">
                    Eksportuj Dane do Google Drive (CSV)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selected items export */}
                  <div className="bg-bg-dark p-4 rounded-lg border border-brand-dark flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="font-bold text-xs text-slate-200">Wybrane produkty ({selectedProducts.length})</h5>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Zapisz wybrane za pomocą checkboxów wiersze do nowego pliku CSV na swoim Dysku.
                      </p>
                    </div>
                    <button
                      onClick={handleExportSelected}
                      disabled={selectedProducts.length === 0 || isActionLoading}
                      className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border-0 transition-all ${
                        selectedProducts.length > 0
                          ? "bg-brand-blue hover:bg-brand-blue/90 text-white cursor-pointer shadow-md"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Eksportuj zaznaczone CSV</span>
                    </button>
                  </div>

                  {/* All items export */}
                  <div className="bg-bg-dark p-4 rounded-lg border border-brand-dark flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="font-bold text-xs text-slate-200">Cała tabela robocza ({currentProducts.length})</h5>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Wyślij pełną listę aktualnie wczytanych produktów jako plik CSV do chmury Google.
                      </p>
                    </div>
                    <button
                      onClick={handleExportAll}
                      disabled={currentProducts.length === 0 || isActionLoading}
                      className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border-0 transition-all ${
                        currentProducts.length > 0
                          ? "bg-slate-700 hover:bg-slate-600 text-slate-100 cursor-pointer shadow-md"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>Eksportuj całą tabelę CSV</span>
                    </button>
                  </div>
                </div>

                <div className="border-b border-brand-dark pb-2 pt-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-emerald-400">
                    Eksportuj bezpośrednio do Arkuszy Google (Google Sheets)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selected items export to Sheets */}
                  <div className="bg-bg-dark p-4 rounded-lg border border-emerald-500/10 flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="font-bold text-xs text-slate-200">Wybrane do Arkusza ({selectedProducts.length})</h5>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Utwórz nowy, sformatowany Arkusz Google z wybranymi produktami.
                      </p>
                    </div>
                    <button
                      onClick={handleSheetsExportSelected}
                      disabled={selectedProducts.length === 0 || isActionLoading}
                      className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border-0 transition-all ${
                        selectedProducts.length > 0
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Eksportuj zaznaczone do Sheets</span>
                    </button>
                  </div>

                  {/* All items export to Sheets */}
                  <div className="bg-bg-dark p-4 rounded-lg border border-emerald-500/10 flex flex-col justify-between space-y-3">
                    <div>
                      <h5 className="font-bold text-xs text-slate-200">Wszystko do Arkusza ({currentProducts.length})</h5>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Utwórz nowy, sformatowany Arkusz Google z całą tabelą roboczą produktów.
                      </p>
                    </div>
                    <button
                      onClick={handleSheetsExportAll}
                      disabled={currentProducts.length === 0 || isActionLoading}
                      className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border-0 transition-all ${
                        currentProducts.length > 0
                          ? "bg-emerald-700 hover:bg-emerald-600 text-slate-100 cursor-pointer shadow-md"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Eksportuj całą tabelę do Sheets</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drive File Browser & Import */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-slate-400">
                    Archiwum analiz na Dysku Google
                  </h4>
                  <button
                    onClick={handleRefreshFiles}
                    disabled={isLoadingFiles}
                    className="p-1 rounded bg-slate-800/80 border border-brand-dark text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Odśwież pliki"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? "animate-spin text-brand-blue" : ""}`} />
                  </button>
                </div>

                <div className="bg-bg-dark border border-brand-dark rounded-lg overflow-hidden">
                  {isLoadingFiles ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2">
                      <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-500 font-mono">Pobieranie plików...</span>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-500 font-mono">
                      Brak plików eksportu Product Scout (.csv, .json) na Twoim dysku Google Drive.
                    </div>
                  ) : (
                    <div className="divide-y divide-brand-dark max-h-60 overflow-y-auto">
                      {files.map((file) => (
                        <div key={file.id} className="p-3 flex items-center justify-between hover:bg-sidebar-dark/40 transition-colors text-xs">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <FileText className="w-4 h-4 text-brand-blue shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-200 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {new Date(file.createdTime).toLocaleString("pl-PL")}
                                {file.size ? ` · ${(Number(file.size) / 1024).toFixed(1)} KB` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleImportFile(file.id, file.name)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1 rounded bg-brand-blue/10 border border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Wczytaj</span>
                            </button>
                            
                            {/* Trash action - with mandatory user confirmation */}
                            <button
                              onClick={() => handleDeleteFile(file.id, file.name)}
                              disabled={isActionLoading}
                              className="p-1.5 rounded hover:bg-brand-red/10 border border-transparent hover:border-brand-red/20 text-slate-500 hover:text-brand-red transition-all cursor-pointer"
                              title="Usuń plik z Dysku"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-dark bg-bg-dark flex justify-end">
          <button 
            id="close-drive-modal-footer-btn"
            onClick={onClose} 
            className="px-5 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs transition-all cursor-pointer border-0"
          >
            Zamknij
          </button>
        </div>

      </div>
    </div>
  );
}
