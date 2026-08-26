/* POST /api/auth/logout — clears the session cookie. */
const { clearSession } = require("../_lib/auth");
const { json } = require("../_lib/util");

module.exports = (req, res) => {
  clearSession(res);
  json(res, 200, { ok: true });
};
