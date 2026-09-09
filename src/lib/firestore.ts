import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { getApp } from "firebase/app";
import { ArbitrageSettings, Worklist, SearchTemplate } from "../types";

// Retrieve the initialized firebase app instance safely
const app = getApp();
export const db = getFirestore(app);

/**
 * Loads user settings from the Firestore users collection.
 */
export async function getUserSettings(uid: string): Promise<ArbitrageSettings | null> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        defaultVatSource: typeof data.defaultVatSource === "number" ? data.defaultVatSource : 19,
        defaultVatTarget: typeof data.defaultVatTarget === "number" ? data.defaultVatTarget : 23,
        exchangeRate: typeof data.exchangeRate === "number" ? data.exchangeRate : 4.31,
        defaultShippingCostEUR: typeof data.defaultShippingCostEUR === "number" ? data.defaultShippingCostEUR : 4.99,
        defaultCommissionPercent: typeof data.defaultCommissionPercent === "number" ? data.defaultCommissionPercent : 8,
        useMockSimulation: !!data.useMockSimulation,
        defaultSourcePlatform: data.defaultSourcePlatform || "Amazon.de",
        defaultTargetPlatform: data.defaultTargetPlatform || "Allegro",
      };
    }
  } catch (err) {
    console.error("Failed to load user settings from Firestore:", err);
  }
  return null;
}

/**
 * Saves or updates user settings in the Firestore users collection.
 */
export async function saveUserSettings(uid: string, email: string, settings: ArbitrageSettings): Promise<void> {
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(
      docRef,
      {
        uid,
        email: email || "",
        defaultVatSource: settings.defaultVatSource,
        defaultVatTarget: settings.defaultVatTarget,
        exchangeRate: settings.exchangeRate,
        defaultShippingCostEUR: settings.defaultShippingCostEUR,
        defaultCommissionPercent: settings.defaultCommissionPercent,
        useMockSimulation: settings.useMockSimulation,
        defaultSourcePlatform: settings.defaultSourcePlatform || "Amazon.de",
        defaultTargetPlatform: settings.defaultTargetPlatform || "Allegro",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Failed to save user settings to Firestore:", err);
    throw err;
  }
}

/**
 * Loads custom worklists for the specified user from the worklists subcollection.
 */
export async function getUserWorklists(uid: string): Promise<Worklist[]> {
  try {
    const colRef = collection(db, "users", uid, "worklists");
    const querySnapshot = await getDocs(colRef);
    const worklists: Worklist[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      worklists.push({
        id: doc.id,
        name: data.name || "Nienazwana lista",
        productIds: Array.isArray(data.productIds) ? data.productIds : [],
        isCustom: data.isCustom !== false,
      });
    });
    return worklists;
  } catch (err) {
    console.error("Failed to fetch worklists from Firestore:", err);
  }
  return [];
}

/**
 * Saves or updates a custom worklist in the user's worklists subcollection.
 */
export async function saveUserWorklist(uid: string, worklist: Worklist): Promise<void> {
  try {
    const docRef = doc(db, "users", uid, "worklists", worklist.id);
    await setDoc(docRef, {
      id: worklist.id,
      name: worklist.name,
      productIds: worklist.productIds,
      isCustom: worklist.isCustom !== false,
      ownerId: uid,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save worklist to Firestore:", err);
    throw err;
  }
}

/**
 * Deletes a custom worklist from the user's worklists subcollection.
 */
export async function deleteUserWorklist(uid: string, worklistId: string): Promise<void> {
  try {
    const docRef = doc(db, "users", uid, "worklists", worklistId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Failed to delete worklist from Firestore:", err);
    throw err;
  }
}

/**
 * Loads custom search templates for the specified user from the search_templates subcollection.
 */
export async function getUserSearchTemplates(uid: string): Promise<SearchTemplate[]> {
  try {
    const colRef = collection(db, "users", uid, "search_templates");
    const querySnapshot = await getDocs(colRef);
    const templates: SearchTemplate[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      templates.push({
        id: docSnap.id,
        name: data.name || "Nienazwany szablon",
        keyword: data.keyword || "",
        sourcePlatform: data.sourcePlatform || "Amazon.de",
        targetPlatform: data.targetPlatform || "Allegro",
        priceMin: typeof data.priceMin === "number" ? data.priceMin : 0,
        priceMax: typeof data.priceMax === "number" ? data.priceMax : 99999,
        resultsLimit: typeof data.resultsLimit === "number" ? data.resultsLimit : 5,
        searchSource: data.searchSource || "local-db",
      });
    });
    return templates;
  } catch (err) {
    console.error("Failed to fetch search templates from Firestore:", err);
  }
  return [];
}

/**
 * Saves or updates a search template in the user's search_templates subcollection.
 */
export async function saveUserSearchTemplate(uid: string, template: SearchTemplate): Promise<void> {
  try {
    const docRef = doc(db, "users", uid, "search_templates", template.id);
    await setDoc(docRef, {
      id: template.id,
      name: template.name,
      keyword: template.keyword,
      sourcePlatform: template.sourcePlatform,
      targetPlatform: template.targetPlatform,
      priceMin: template.priceMin,
      priceMax: template.priceMax,
      resultsLimit: template.resultsLimit,
      searchSource: template.searchSource,
      ownerId: uid,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save search template to Firestore:", err);
    throw err;
  }
}

/**
 * Deletes a search template from the user's search_templates subcollection.
 */
export async function deleteUserSearchTemplate(uid: string, templateId: string): Promise<void> {
  try {
    const docRef = doc(db, "users", uid, "search_templates", templateId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Failed to delete search template from Firestore:", err);
    throw err;
  }
}
