/* =====================================================================
   Small JSON documents in a private Supabase Storage bucket.

   Used by the blog review area (api/review.js). Storage needs no schema
   migration, the bucket is private, and the only credential involved is
   the server-side service-role key already used by api/_lib/db.js — the
   browser never talks to Supabase directly.
   ===================================================================== */
const { config } = require("./db");

const BUCKET = "blog-reviews";
let bucketReady = false;

async function storage(method, path, body, headers) {
  const { url, key } = config();
  return fetch(url + "/storage/v1" + path, {
    method,
    headers: Object.assign({ apikey: key, Authorization: "Bearer " + key }, headers || {}),
    body,
  });
}

async function ensureBucket() {
  if (bucketReady) return;
  const probe = await storage("GET", `/bucket/${BUCKET}`);
  if (probe.ok) { bucketReady = true; return; }
  const made = await storage("POST", "/bucket", JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    { "Content-Type": "application/json" });
  if (!made.ok && made.status !== 409) {
    const err = new Error("Storage error creating bucket: " + (await made.text()).slice(0, 300));
    err.statusCode = 500;
    throw err;
  }
  bucketReady = true;
}

async function getJson(name) {
  await ensureBucket();
  const res = await storage("GET", `/object/${BUCKET}/${name}`);
  if (res.status === 404 || res.status === 400) return null; // storage answers 400 "not_found" for missing objects
  if (!res.ok) {
    const err = new Error("Storage error reading " + name + ": " + (await res.text()).slice(0, 300));
    err.statusCode = 500;
    throw err;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function putJson(name, value) {
  await ensureBucket();
  const res = await storage("POST", `/object/${BUCKET}/${name}`, JSON.stringify(value, null, 2),
    { "Content-Type": "application/json", "x-upsert": "true" });
  if (!res.ok) {
    const err = new Error("Storage error writing " + name + ": " + (await res.text()).slice(0, 300));
    err.statusCode = 500;
    throw err;
  }
}

module.exports = { getJson, putJson };
