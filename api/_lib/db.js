/* =====================================================================
   Thin PostgREST client for the server API. Uses the Supabase
   service-role key, which exists only in server env vars and is never
   sent to the browser. RLS denies all other keys, so every read/write
   flows through these authenticated endpoints.
   ===================================================================== */

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
    err.statusCode = 503;
    throw err;
  }
  return { url: url.replace(/\/$/, ""), key };
}

async function rest(method, path, body, headers) {
  const { url, key } = config();
  const res = await fetch(url + "/rest/v1" + path, {
    method,
    headers: Object.assign({
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: method === "POST" || method === "PATCH" ? "return=representation" : "return=minimal",
    }, headers || {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error("Database error: " + text.slice(0, 400));
    err.statusCode = res.status === 404 ? 404 : 500;
    throw err;
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const db = {
  select: (table, query) => rest("GET", `/${table}?${query || "select=*"}`),
  insert: (table, row) => rest("POST", `/${table}`, row),
  update: (table, query, patch) => rest("PATCH", `/${table}?${query}`, patch),
  rpc: async (fn, args) => {
    const { url, key } = config();
    const res = await fetch(url + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(args || {}),
    });
    const text = await res.text();
    if (!res.ok) {
      let message = text;
      try { message = JSON.parse(text).message || text; } catch (e) {}
      const err = new Error(message.slice(0, 400));
      err.statusCode = 400;
      throw err;
    }
    return text ? JSON.parse(text) : null;
  },
};

module.exports = db;
