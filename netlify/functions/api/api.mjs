import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

// Pour node-fetch ESM dynamique (Netlify le supporte)
// const fetch = require("node-fetch");
// const fetch = async (await import("node-fetch")).default;

// --- CONFIG FIREBASE ADMIN ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "dahaba-poulet-7624.firebasestorage.app",
  });
}

const db = admin.firestore();
const auth = admin.auth();
const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ----------------------------------------------------
// 🔹 Vérification admin
async function checkAdmin(adminToken) {
  try {
    const decoded = jwt.verify(adminToken, JWT_SECRET);
    if (decoded.user && (decoded.user.role === "Administrateur" || decoded.user.role === "admin")) {
      return { success: true };
    }
    return { success: false, message: "Accès refusé : admin requis" };
  } catch (err) {
    return { success: false, message: "Session expirée ou invalide" };
  }
}

// ----------------------------------------------------
// 🔹 Fonctions Firestore CRUD
const getAll = async (collection, filters) => {
  let ref = db.collection(collection);

  if (filters?.length) {
    filters.forEach(({ field, operator, value }) => {
      ref = ref.where(field, operator, value);
    });
  }

  const snap = await ref.get();
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return { success: true, data };
};

const getById = async (collection, id) => {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return { success: false, message: "Document introuvable" };
  return { success: true, data: { id: doc.id, ...doc.data() } };
};

const addItem = async (collection, data) => {
  const id = uuidv4();
  await db.collection(collection).doc(id).set(data);
  return { success: true, message: "Ajouté avec succès", id };
};

const addItems = async (collection, data) => {
  const batch = db.batch();

  const ids = data.map((item) => {
    const id = item.id ?? uuidv4(); // ✅ utilise item.id s'il existe, sinon génère un uuid
    const { id: _, ...itemData } = item; // retire item.id du document pour éviter la duplication
    const ref = db.collection(collection).doc(id);
    batch.set(ref, itemData);
    return id;
  });

  await batch.commit();
  return { success: true, message: "Ajoutés avec succès", ids };
};

const updateItem = async (collection, id, data) => {
  await db.collection(collection).doc(id).update(data);
  return { success: true, message: "Mis à jour", id };
};

const deleteItem = async (collection, id) => {
  // Cascade: supprimer familles → supprime catégories liées → supprime produits liés
  if (collection === "familles") {
    const doc = await db.collection("familles").doc(id).get();
    if (doc.exists) {
      const famille = doc.data();
      const catsSnap = await db.collection("categories").where("famille", "==", famille.designation).get();
      for (const catDoc of catsSnap.docs) {
        await deleteItem("categories", catDoc.id); // recursive cascade
      }
    }
  }

  // Cascade: supprimer catégories → supprime produits liés
  if (collection === "categories") {
    const prodsSnap = await db.collection("produits").where("categorie_id", "==", id).get();
    const batch = db.batch();
    prodsSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  await db.collection(collection).doc(id).delete();
  return { success: true, message: "Supprimé", id };
};

// ----------------------------------------------------
// 🔹 Authentification Firebase
const authenticate = async (user) => {
  const { email, password } = user;
  const API_KEY = process.env.FIREBASE_API_KEY;

  if (!API_KEY) throw new Error("Clé API manquante");

  const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

  const fbRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const fbData = await fbRes.json();
  if (fbData.error) throw new Error(fbData.error.message);

  const payload = { uid: fbData.localId, email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  return { success: true, token, user: payload };
};

// 🔹 Add user Firebae
const addUser = async (user) => {
  const { email, password, role } = user;
  const API_KEY = process.env.FIREBASE_API_KEY;
  
  if (!API_KEY) throw new Error("Clé API manquante");

  const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
  const fbRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const fbData = await fbRes.json();
  if (fbData.error) throw new Error(fbData.error.message);

  return { success: true, message: "Utilisateur ajouté avec succès", uid: fbData.localId };
}

// 🔹 delete user Firebae
const deleteUser = async (user) => {
  const { uid: id } = user;
  try{
    await auth.deleteUser(uid);
  }catch(e){
    
  }
}

// ----------------------------------------------------
// 🔹 Session utilisateur
const userSession = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, user: decoded };
  } catch {
    return { success: false, message: "Token invalide" };
  }
};

// ----------------------------------------------------
// 🔹 Parseur utilitaires
const parseRequest = (event) => {
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};
  const path = event.path.replace("/.netlify/functions/api", "").substring(1);
  const query = event.queryStringParameters || {};
  return { method, path, body, query };
};

const parseFilters = (filtersString) => {
  if (!filtersString) return [];
  return filtersString.split(",").map(f => {
    const match = f.match(/(>=|<=|!=|>|<|=)/);
    if (!match) return null;
    const [field, value] = f.split(match[0]);
    return { field: field.trim(), operator: match[0], value: value.trim() };
  }).filter(Boolean);
};

// ----------------------------------------------------
// 🔹 Router principal
export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    const { method, path, body, query } = parseRequest(event);
    const parts = path.split("/").filter(Boolean);
    const authRoutes = [
      "v1/authenticate/auth", "v1/sessions/valided", "v1/authenticate/add-user",
      "v1/authenticate/delete-user",
    ];

    // Route : /v1/:collection[/id]
    if (!authRoutes.includes(path)) {
      const collection = parts[1];
      const id = parts[2];
      const filters = parseFilters(query.filters);

      switch (method) {
        case "GET":
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(id ? await getById(collection, id) : await getAll(collection, filters)),
          };
        case "POST":
          return { 
            statusCode: 201, 
            headers, 
            body: JSON.stringify(Array.isArray(body)? await addItems(collection, body) : await addItem(collection, body)) };
        case "PUT":
          return { statusCode: 200, headers, body: JSON.stringify(await updateItem(collection, id, body)) };
        case "DELETE":
          return { statusCode: 200, headers, body: JSON.stringify(await deleteItem(collection, id)) };
      }
    }

    // Route : /v1/authenticate
    if (path === "v1/authenticate/auth" && method === "POST") {
      console.log("Authenticating user...");
      const res = await authenticate(body);
      return { statusCode: 200, headers, body: JSON.stringify(res) };
    }

    // Route : /v1/sessions
    if (path === "v1/sessions/valided" && method === "POST") {
      console.log("Validating user session...");
      const res = await userSession(body.token);
      return { statusCode: 200, headers, body: JSON.stringify(res) };
    }

    // Route : /v1/authenticate/add-user
    if (path === "v1/authenticate/add-user" && method === "POST") {
      const res = await addUser(body);
      return { statusCode: 200, headers, body: JSON.stringify(res) };
    }

    // Route : /v1/authenticate/delete-user
    if (path === "v1/authenticate/delete-user" && method === "POST") {
      const res = await deleteUser(body);
      return { statusCode: 200, headers, body: JSON.stringify(res) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: "Route inconnue" }) };
  } catch (err) {
    console.error("❌ API ERROR:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: err.message }) };
  }
}