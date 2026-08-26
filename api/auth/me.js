/* GET /api/auth/me — reports the signed-in admin, or 401. */
const { requireAuth } = require("../_lib/auth");
const { json } = require("../_lib/util");

module.exports = (req, res) => {
  const session = requireAuth(req, res);
  if (!session) return;
  json(res, 200, { email: session.email });
};
