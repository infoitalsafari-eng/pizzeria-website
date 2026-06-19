// src/services/useApiService.ts
import { useState, useEffect } from "react";
import { offlineStorage } from "./offlineStorage";
import { syncService } from "./syncService";

/** 🔹 Détection d'environnement (local vs Netlify) */
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.endsWith(".local"));

/** 🔹 URL de base des endpoints */
const LOCAL_API_URL = "http://192.168.0.202:3000/api/v1";
const PROD_API_URL = "https://pizzeriachezmoi.com/.netlify/functions/api/v1"; // <- point d’entrée Netlify Functions

const API_URL = PROD_API_URL; // isLocalhost ? LOCAL_API_URL : PROD_API_URL;

/** 🔹 Fonction d’appel HTTP générique */
async function execute<T>(endpoint: string, method: string, body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);

  // 🔸 Gestion d’erreurs propre
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json().catch(() => ({}));
  return data as T;
}

/** 🔹 Hook CRUD universel */
export const useApiService = <T extends { id?: string }>(collection: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = `${API_URL}/${collection}`;

  /** 🔸 Lecture complète avec cache offline */
  const get = async () => {
    setLoading(true);
    setError(null);
    try {
      // Essayer de récupérer depuis le réseau
      const res = await execute<{ data: T[] }>(url, "GET");
      const fetchedData = res.data || [];
      setData(fetchedData);
      
      // Mettre en cache pour usage offline
      await offlineStorage.cacheData(collection, fetchedData);
      
      return fetchedData;
    } catch (err: any) {
      console.error("GET error:", err);
      setError(err.message);
      
      // En cas d'erreur, charger depuis le cache offline
      if (!navigator.onLine) {
        const cachedData = await offlineStorage.getCachedData(collection);
        if (cachedData) {
          setData(cachedData as T[]);
          return cachedData as T[];
        }
      }
      
      return [];
    } finally {
      setLoading(false);
    }
  };

  /** 🔸 Lecture filtrée */
  const getFiltered = async (filters: Record<string, string>) => {
    const query = new URLSearchParams(filters).toString();
    return await execute<{ data: T[] }>(`${url}?${query}`, "GET");
  };

  /** 🔸 Création avec support offline */
  const add = async (newData: Partial<T>) => {
    try {
      if (!navigator.onLine) {
        // Mode offline : ajouter à la queue
        await offlineStorage.addPendingOperation(collection, "add", newData);
        
        // Créer un ID temporaire et ajouter au state local
        const tempId = `temp-${Date.now()}`;
        const tempData = { ...newData, id: tempId } as T;
        setData((prev) => [...prev, tempData]);
        
        return tempData;
      }
      
      // Mode online : envoi normal
      const res = await execute<{ data: T }>(url, "POST", newData);
      setData((prev) => [...prev, res.data]);
      
      // Rafraîchir le cache
      await get();
      
      return res.data;
    } catch (error) {
      // En cas d'erreur, ajouter à la queue offline
      await offlineStorage.addPendingOperation(collection, "add", newData);
      
      const tempId = `temp-${Date.now()}`;
      const tempData = { ...newData, id: tempId } as T;
      setData((prev) => [...prev, tempData]);
      
      throw error;
    }
  };

  /** 🔸 Mise à jour par ID avec support offline */
  const update = async (id: string, updatedData: Partial<T>) => {
    try {
      if (!navigator.onLine) {
        // Mode offline : ajouter à la queue
        await offlineStorage.addPendingOperation(collection, "update", {
          ...updatedData,
          id,
        });
        
        // Mettre à jour le state local
        setData((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...updatedData } : doc)));
        
        return { ...updatedData, id } as T;
      }
      
      // Mode online : envoi normal
      const res = await execute<{ data: T }>(`${url}/${id}`, "PUT", updatedData);
      setData((prev) => prev.map((doc) => (doc.id === id ? res.data : doc)));
      
      // Rafraîchir le cache
      await get();
      
      return res.data;
    } catch (error) {
      // En cas d'erreur, ajouter à la queue offline
      await offlineStorage.addPendingOperation(collection, "update", {
        ...updatedData,
        id,
      });
      
      setData((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...updatedData } : doc)));
      
      throw error;
    }
  };

  /** 🔸 Suppression par ID avec support offline */
  const deleteDoc = async (id: string) => {
    try {
      if (!navigator.onLine) {
        // Mode offline : ajouter à la queue
        await offlineStorage.addPendingOperation(collection, "delete", { id });
        
        // Supprimer du state local
        setData((prev) => prev.filter((doc) => doc.id !== id));
        return;
      }
      
      // Mode online : envoi normal
      await execute(`${url}/${id}`, "DELETE");
      setData((prev) => prev.filter((doc) => doc.id !== id));
      
      // Rafraîchir le cache
      await get();
    } catch (error) {
      // En cas d'erreur, ajouter à la queue offline
      await offlineStorage.addPendingOperation(collection, "delete", { id });
      setData((prev) => prev.filter((doc) => doc.id !== id));
      
      throw error;
    }
  };

  const getSynch = () => {
    if (typeof window === "undefined") return () => {};
    // Désactiver le WebSocket pour l'instant car pas encore configuré
    return () => {};
    
    /* WebSocket temporairement désactivé
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = isLocalhost ? "192.168.0.202:3000" : window.location.host;
    const ws = new WebSocket(`${protocol}://${wsHost}`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "change" && (!msg.collection || msg.collection === collection)) {
          get();
        }
      } catch { console.warn("Invalid WebSocket message:", event.data); }
    };
    return () => ws.close();
    */
  };

  useEffect(() => {
    // Chargement initial avec support cache offline
    get();
    
    const close = getSynch();
    
    // Écouter les synchronisations
    const unsubscribe = syncService.onSyncComplete(() => {
      console.log(`🔄 Rafraîchissement de ${collection} après sync`);
      get();
    });
    
    return () => {
      close();
      unsubscribe();
    };
  }, [collection]);

  return {
    data,
    loading,
    error,
    get,
    getFiltered,
    add,
    update,
    deleteDoc,
  };
};
