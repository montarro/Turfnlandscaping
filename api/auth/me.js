/* GET /api/auth/me — reports the signed-in admin, or a diagnosable 401. */
const { getSessionDebug } = require("../_lib/auth");
const { json } = require("../_lib/util");

module.exports = (req, res) => {
  const { session, reason } = getSessionDebug(req);
  if (!session) return json(res, 401, { error: "Not signed in", reason: reason });
  json(res, 200, { email: session.email });
};
