/* =====================================================================
   Thin PostgREST client for the server API. Uses the Supabase
   service-role key, which exists only in server env vars and is never
   sent to the browser. RLS denies all other keys, so every read/write
   flows through these authenticated endpoints.
   ===================================================================== */

function config() {
  /* The project URL is a public value and is already inlined in
     api/auth/[action].js, so a default heals a mangled env-var paste —
     a valid-looking env value still wins. The service-role key stays
     env-only: it bypasses RLS and must never live in the repo. */
  const DEFAULT_URL = "https://podlutvvrclhxmhgupil.supabase.co";
  const envUrl = (process.env.SUPABASE_URL || "").trim();
  const url = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(envUrl) ? envUrl : DEFAULT_URL;

  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key || !key.startsWith("eyJ") || key.length < 150) {
    const err = new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing or truncated on this deployment — " +
      "re-paste it in Vercel (Settings -> Environment Variables) with Production ticked, then redeploy"
    );
    err.statusCode = 503;
    throw err;
  }
  return { url, key };
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
