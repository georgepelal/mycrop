import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Parcel, UserSubscription, Crop, DiagnosticLog } from "../types";

// Collection path helper
const PATH_PARCELS = "parcels";
const PATH_USERS = "users";


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

/**
 * Creates a brand new agricultural parcel in the database for a specific user.
 */
export async function createParcelForUser(uid: string, parcel: Parcel): Promise<void> {
  const docId = parcel.id;
  try {
    const ref = doc(db, PATH_PARCELS, docId);
    const payload = {
      ...parcel,
      ownerId: uid,
      // Fallback defaults for optional properties so they are defined
      soilType: parcel.soilType || "Loamy",
      soilPH: Number(parcel.soilPH ?? 6.5),
      nitrogen: parcel.nitrogen || "Optimal",
      plantingMonth: parcel.plantingMonth || "May",
      ndviValue: Number(parcel.ndviValue ?? 0.5),
      ndwiValue: Number(parcel.ndwiValue ?? 0.5),
      soilMoisture: Number(parcel.soilMoisture ?? 50),
      costPerHectare: Number(parcel.costPerHectare ?? 900),
      marketPricePerTon: Number(parcel.marketPricePerTon ?? 200),
      customImage: parcel.customImage || null,
      latitude: Number(parcel.latitude ?? 41.890),
      longitude: Number(parcel.longitude ?? -87.954),
      lastUpdated: parcel.lastUpdated || new Date().toLocaleDateString(),
      billingStatus: parcel.billingStatus || "unpaid",
      billingCycle: parcel.billingCycle || "monthly",
      billingAmount: Number(parcel.billingAmount ?? 0),
      billingExpiration: parcel.billingExpiration || "",
      
      // SoilGrids telemetry fields defaults
      soilGridsClay: parcel.soilGridsClay !== undefined ? parcel.soilGridsClay : null,
      soilGridsSand: parcel.soilGridsSand !== undefined ? parcel.soilGridsSand : null,
      soilGridsSilt: parcel.soilGridsSilt !== undefined ? parcel.soilGridsSilt : null,
      soilGridsSoc: parcel.soilGridsSoc !== undefined ? parcel.soilGridsSoc : null,
      soilGridsNitrogenValue: parcel.soilGridsNitrogenValue !== undefined ? parcel.soilGridsNitrogenValue : null,
      isRealSoilGridsUsed: parcel.isRealSoilGridsUsed !== undefined ? parcel.isRealSoilGridsUsed : false
    };
    await setDoc(ref, payload);
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
    const payload = {
      ...parcel,
      ownerId: uid,
      soilType: parcel.soilType || "Loamy",
      soilPH: Number(parcel.soilPH ?? 6.5),
      nitrogen: parcel.nitrogen || "Optimal",
      plantingMonth: parcel.plantingMonth || "May",
      ndviValue: Number(parcel.ndviValue ?? 0.5),
      ndwiValue: Number(parcel.ndwiValue ?? 0.5),
      soilMoisture: Number(parcel.soilMoisture ?? 50),
      costPerHectare: Number(parcel.costPerHectare ?? 900),
      marketPricePerTon: Number(parcel.marketPricePerTon ?? 200),
      customImage: parcel.customImage || null,
      latitude: Number(parcel.latitude ?? 41.890),
      longitude: Number(parcel.longitude ?? -87.954),
      lastUpdated: new Date().toLocaleDateString(),
      billingStatus: parcel.billingStatus || "unpaid",
      billingCycle: parcel.billingCycle || "monthly",
      billingAmount: Number(parcel.billingAmount ?? 0),
      billingExpiration: parcel.billingExpiration || "",
      
      // SoilGrids telemetry fields defaults
      soilGridsClay: parcel.soilGridsClay !== undefined ? parcel.soilGridsClay : null,
      soilGridsSand: parcel.soilGridsSand !== undefined ? parcel.soilGridsSand : null,
      soilGridsSilt: parcel.soilGridsSilt !== undefined ? parcel.soilGridsSilt : null,
      soilGridsSoc: parcel.soilGridsSoc !== undefined ? parcel.soilGridsSoc : null,
      soilGridsNitrogenValue: parcel.soilGridsNitrogenValue !== undefined ? parcel.soilGridsNitrogenValue : null,
      isRealSoilGridsUsed: parcel.isRealSoilGridsUsed !== undefined ? parcel.isRealSoilGridsUsed : false
    };
    await setDoc(ref, payload);
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

/**
 * Retrieves the subscription or membership profile details for a verified user, or returns null.
 */
export async function getUserSubscription(uid: string): Promise<UserSubscription | null> {
  try {
    const ref = doc(db, PATH_USERS, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserSubscription;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${PATH_USERS}/${uid}`);
    return null;
  }
}

/**
 * Saves or updates a user's subscription profile details in Firestore.
 */
export async function saveUserSubscription(uid: string, subscription: UserSubscription): Promise<void> {
  try {
    const ref = doc(db, PATH_USERS, uid);
    const payload = {
      uid: subscription.uid,
      planId: subscription.planId,
      planName: subscription.planName,
      status: subscription.status,
      billingPeriod: subscription.billingPeriod,
      currentPeriodEnd: subscription.currentPeriodEnd,
      amount: Number(subscription.amount),
      updatedAt: new Date().toLocaleDateString()
    };
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PATH_USERS}/${uid}`);
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



