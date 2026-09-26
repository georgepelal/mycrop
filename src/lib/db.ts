import {
  collection,
  doc,
  getDocs,
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Parcel, Crop, DiagnosticLog } from "../types";

// Collection path helper
const PATH_PARCELS = "parcels";


/**
 * Fetches all agricultural parcels belonging to the specified logged-in user's UID.
 */
export async function getParcelsForUser(uid: string): Promise<Parcel[]> {
  try {
    const q = query(
      collection(db, PATH_PARCELS),
      where("ownerId", "==", uid)
    );
    const snap = await getDocs(q);
    const results: Parcel[] = [];
    snap.forEach((d) => {
      const data = d.data();
      results.push({
        ...data,
        id: d.id,
      } as Parcel);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PATH_PARCELS);
    return [];
  }
}

// Readings are stored as entered or measured; a missing one stays null.
// These writers used to substitute pH 6.5, NDVI 0.5, 50% moisture, $900/ha,
// $200/t and a Chicago-area location, which the app then displayed and fed
// into advice as though they were the farmer's own data.
function reading(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parcelPayload(uid: string, parcel: Parcel) {
  return {
    ...parcel,
    ownerId: uid,
    soilType: parcel.soilType || null,
    soilPH: reading(parcel.soilPH),
    nitrogen: parcel.nitrogen || null,
    plantingMonth: parcel.plantingMonth || null,
    ndvi: reading(parcel.ndvi),
    ndviValue: reading(parcel.ndviValue),
    ndwiValue: reading(parcel.ndwiValue),
    soilMoisture: reading(parcel.soilMoisture),
    predictedYield: reading(parcel.predictedYield),
    cropHeight: reading(parcel.cropHeight),
    costPerHectare: reading(parcel.costPerHectare),
    marketPricePerTon: reading(parcel.marketPricePerTon),
    customImage: parcel.customImage || null,
    latitude: reading(parcel.latitude),
    longitude: reading(parcel.longitude),
    soilGridsClay: parcel.soilGridsClay ?? null,
    soilGridsSand: parcel.soilGridsSand ?? null,
    soilGridsSilt: parcel.soilGridsSilt ?? null,
    soilGridsSoc: parcel.soilGridsSoc ?? null,
    soilGridsNitrogenValue: parcel.soilGridsNitrogenValue ?? null,
    isRealSoilGridsUsed: parcel.isRealSoilGridsUsed ?? false,
  };
}

/**
 * Creates a brand new agricultural parcel in the database for a specific user.
 */
export async function createParcelForUser(uid: string, parcel: Parcel): Promise<void> {
  const docId = parcel.id;
  try {
    const ref = doc(db, PATH_PARCELS, docId);
    await setDoc(ref, { ...parcelPayload(uid, parcel), lastUpdated: parcel.lastUpdated || new Date().toLocaleDateString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PATH_PARCELS}/${docId}`);
  }
}

/**
 * Updates an existing parcel in the database for a specific user.
 */
export async function updateParcelForUser(uid: string, parcel: Parcel): Promise<void> {
  const docId = parcel.id;
  try {
    const ref = doc(db, PATH_PARCELS, docId);
    await setDoc(ref, { ...parcelPayload(uid, parcel), lastUpdated: new Date().toLocaleDateString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PATH_PARCELS}/${docId}`);
  }
}

/**
 * Deletes a parcel from the database.
 */
export async function deleteParcelFromUser(parcelId: string): Promise<void> {
  try {
    const ref = doc(db, PATH_PARCELS, parcelId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PATH_PARCELS}/${parcelId}`);
  }
}

const PATH_CROPS = "crops";

/**
 * Retrieves the compiled crops catalog from Firestore. Returns empty if not seeded yet.
 */
export async function getCropsCatalog(): Promise<Crop[]> {
  try {
    const snap = await getDocs(collection(db, PATH_CROPS));
    const results: Crop[] = [];
    snap.forEach((d) => {
      results.push({
        id: d.id,
        ...d.data()
      } as Crop);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, PATH_CROPS);
    return [];
  }
}

/**
 * Saves/updates a list of crops to the Firestore "crops" collection.
 */
export async function saveCropsCatalog(crops: Crop[]): Promise<void> {
  try {
    for (const crop of crops) {
      const ref = doc(db, PATH_CROPS, crop.id);
      await setDoc(ref, {
        name: crop.name,
        icon: crop.icon,
        category: crop.category || "Cash Crops & Others",
        description: crop.description || "",
        soilPHRange: crop.soilPHRange || "",
        waterRequirement: crop.waterRequirement || "",
        growthDuration: crop.growthDuration || "",
        sourcedAt: new Date().toLocaleDateString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PATH_CROPS);
  }
}

/**
 * Fetches historic diagnostic calculations/logs for a specific parcel.
 */
export async function getDiagnosticsForParcel(parcelId: string): Promise<DiagnosticLog[]> {
  try {
    const collRef = collection(db, PATH_PARCELS, parcelId, "diagnostics");
    const snap = await getDocs(collRef);
    const results: DiagnosticLog[] = [];
    snap.forEach((d) => {
      results.push({
        id: d.id,
        ...d.data()
      } as DiagnosticLog);
    });
    // Sort by timestamp descending
    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `${PATH_PARCELS}/${parcelId}/diagnostics`);
    return [];
  }
}

/**
 * Persists an environmental diagnostic log under a specific parcel.
 */
export async function addDiagnosticToParcel(parcelId: string, log: DiagnosticLog): Promise<void> {
  const docId = log.id;
  try {
    const ref = doc(db, PATH_PARCELS, parcelId, "diagnostics", docId);
    await setDoc(ref, {
      id: log.id,
      parcelId: log.parcelId,
      timestamp: log.timestamp || new Date().toISOString(),
      category: log.category,
      apiSource: log.apiSource,
      metricsJSONString: log.metricsJSONString || "{}",
      summary: log.summary || "",
      status: log.status || "info"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PATH_PARCELS}/${parcelId}/diagnostics/${docId}`);
  }
}

/**
 * Deletes a historic diagnostic log from a parcel's archive.
 */
export async function deleteDiagnosticFromParcel(parcelId: string, logId: string): Promise<void> {
  try {
    const ref = doc(db, PATH_PARCELS, parcelId, "diagnostics", logId);
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PATH_PARCELS}/${parcelId}/diagnostics/${logId}`);
  }
}



