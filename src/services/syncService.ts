// Service de synchronisation des données offline
import { offlineStorage } from "./offlineStorage";

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.endsWith(".local"));

const LOCAL_API_URL = "http://192.168.0.202:3000/api/v1";
const PROD_API_URL = "https://man-gestion.netlify.app/.netlify/functions/api/v1";
const API_URL = PROD_API_URL; //isLocalhost ? LOCAL_API_URL : PROD_API_URL;

class SyncService {
  private isSyncing = false;
  private syncListeners: Set<() => void> = new Set();

  // Écouter les changements de connexion
  initNetworkListener() {
    if (typeof window === "undefined") return;

    window.addEventListener("online", () => {
      console.log("🟢 Connexion rétablie - Synchronisation...");
      this.syncPendingOperations();
    });

    window.addEventListener("offline", () => {
      console.log("🔴 Mode hors ligne activé");
    });

    // Sync initial si en ligne
    if (navigator.onLine) {
      this.syncPendingOperations();
    }
  }

  // Ajouter un listener pour les changements de sync
  onSyncComplete(callback: () => void) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  // Vérifier si une donnée est corrompue
  private isDataCorrupted(data: any): boolean {
    if (data === undefined || data === null) return true;
    if (typeof data === "object") {
      // Vérifier si l'objet est vide de manière inattendue
      if (Array.isArray(data)) {
        return data.some((item) => item === undefined || item === null);
      }
      // Vérifier les propriétés essentielles
      if (data.id === undefined && data.collection === undefined) {
        return false; // Pas nécessairement corrompu
      }
    }
    return false;
  }

  // Synchroniser toutes les opérations en attente
  async syncPendingOperations(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;

    try {
      const pendingOps = await offlineStorage.getPendingOperations();

      console.log(`📤 Synchronisation de ${pendingOps.length} opérations...`);

      // Trier par timestamp pour respecter l'ordre
      pendingOps.sort((a, b) => a.timestamp - b.timestamp);

      for (const op of pendingOps) {
        try {
          // Vérifier si les données sont corrompues
          if (this.isDataCorrupted(op.data)) {
            console.warn(`⚠️ Données corrompues détectées pour l'opération ${op.id}, suppression...`);
            await offlineStorage.removePendingOperation(op.id);
            continue;
          }

          // Vérifier que les champs requis sont présents
          if (op.operation !== "delete" && (!op.data || typeof op.data !== "object")) {
            console.warn(`⚠️ Données invalides pour l'opération ${op.id}, suppression...`);
            await offlineStorage.removePendingOperation(op.id);
            continue;
          }

          await this.executeOperation(op);
          await offlineStorage.removePendingOperation(op.id);
          console.log(`✅ Opération ${op.id} synchronisée`);
        } catch (error: any) {
          console.error(`❌ Erreur sync opération ${op.id}:`, error);
          
          // Si l'erreur indique des données corrompues (400, 422), supprimer l'opération
          if (error?.message?.includes("400") || error?.message?.includes("422") || error?.message?.includes("corrupt")) {
            console.warn(`⚠️ Suppression de l'opération corrompue ${op.id}`);
            await offlineStorage.removePendingOperation(op.id);
          }
          // Continue avec les autres opérations
        }
      }

      // Notifier les listeners
      this.syncListeners.forEach((callback) => callback());

      console.log("✅ Synchronisation terminée");
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async executeOperation(op: {
    collection: string;
    operation: "add" | "update" | "delete";
    data: any;
  }): Promise<void> {
    const url = `${API_URL}/${op.collection}`;

    let method: string;
    let endpoint: string;

    switch (op.operation) {
      case "add":
        method = "POST";
        endpoint = url;
        break;
      case "update":
        method = "PUT";
        endpoint = `${url}/${op.data.id}`;
        break;
      case "delete":
        method = "DELETE";
        endpoint = `${url}/${op.data.id || op.data}`;
        break;
    }

    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };

    if (op.operation !== "delete") {
      options.body = JSON.stringify(op.data);
    }

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
  }

  // Vérifier s'il y a des opérations en attente
  async hasPendingOperations(): Promise<boolean> {
    const ops = await offlineStorage.getPendingOperations();
    return ops.length > 0;
  }

  // Obtenir le nombre d'opérations en attente
  async getPendingCount(): Promise<number> {
    const ops = await offlineStorage.getPendingOperations();
    return ops.length;
  }
}

export const syncService = new SyncService();
