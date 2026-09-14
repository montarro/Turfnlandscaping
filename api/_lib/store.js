/* =====================================================================
   Small JSON documents in a private Vercel Blob store ("blog-reviews").

   Used by the blog review area (api/review.js). Needs no database or
   schema: BLOB_READ_WRITE_TOKEN is injected by Vercel for every
   environment, the store is private, and the browser never touches it —
   every read and write goes through /api/review.
   ===================================================================== */
const { put, get } = require("@vercel/blob");

function wrap(e, what) {
  const err = new Error(`Feedback storage ${what} failed: ${e && e.message ? e.message : e}`);
  err.statusCode = 503;
  return err;
}

async function getJson(name) {
  let r;
  try { r = await get(name, { access: "private", useCache: false }); }
  catch (e) { throw wrap(e, "read"); }
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  const text = await new Response(r.stream).text();
  return text ? JSON.parse(text) : null;
}

async function putJson(name, value) {
  try {
    await put(name, JSON.stringify(value, null, 2), {
      access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
    });
  } catch (e) { throw wrap(e, "write"); }
}

module.exports = { getJson, putJson };
