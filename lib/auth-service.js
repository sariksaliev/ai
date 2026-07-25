const crypto = require('crypto');
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
function verifyPassword(password, user) { const candidate = crypto.scryptSync(password, user.passwordSalt, 64); return crypto.timingSafeEqual(candidate, Buffer.from(user.passwordHash, 'hex')); }
function createSession(data, user) { const token = crypto.randomBytes(32).toString('hex'); data.sessions = data.sessions.filter((session) => session.userId !== user.id); data.sessions.push({ token, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() }); return token; }
function getUserFromRequest(request, data) { const token = request.headers.authorization?.replace(/^Bearer\s+/i, ''); const session = data.sessions.find((item) => item.token === token && new Date(item.expiresAt) > new Date()); if (!session) return null; return data.users.find((user) => user.id === session.userId) || null; }
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role }; }
module.exports = { verifyPassword, createSession, getUserFromRequest, publicUser };
