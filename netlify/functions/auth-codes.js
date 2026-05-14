import { getDb } from './lib/db.js';

const DEFAULTS = [
  { user: 'Ryder',   code: '82047', role: 'owner' },
  { user: 'Logan',   code: '63914', role: 'slave owner' },
  { user: 'Beckham', code: '11111', role: 'slave' },
  { user: 'Kolby',   code: '22222', role: 'slave' },
  { user: 'Levi',    code: '33333', role: 'slave' },
  { user: 'Liam',    code: '44444', role: 'slave' },
  { user: 'Gibson',  code: '55555', role: 'slave' },
];

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const handler = async (event) => {
  const db = await getDb();

  // GET — return all users
  if (event.httpMethod === 'GET') {
    let users;
    if (db) {
      const docs = await db.collection('users').find({}).toArray();
      // merge defaults with DB overrides
      users = DEFAULTS.map(d => {
        const found = docs.find(x => x.user === d.user);
        return found ? { user: found.user, code: found.code, role: found.role } : d;
      });
      // include any DB-only users not in defaults
      for (const doc of docs) {
        if (!DEFAULTS.find(d => d.user === doc.user)) {
          users.push({ user: doc.user, code: doc.code, role: doc.role });
        }
      }
    } else {
      const overrides = globalThis.__codeOverrides || {};
      users = DEFAULTS.map(u => ({ user: u.user, role: u.role, code: overrides[u.user] || u.code }));
    }
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ users }) };
  }

  // POST — update or add a user's code
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'bad json' }) }; }
    const { actorCode, user, code, role, action } = body;

    // resolve actor
    let actor;
    if (db) {
      const all = await db.collection('users').find({}).toArray();
      const merged = DEFAULTS.map(d => {
        const f = all.find(x => x.user === d.user);
        return f || d;
      });
      actor = merged.find(u => u.code === String(actorCode));
    } else {
      const overrides = globalThis.__codeOverrides || {};
      actor = DEFAULTS.find(u => (overrides[u.user] || u.code) === String(actorCode));
    }
    if (!actor || actor.role !== 'owner') return { statusCode: 403, body: JSON.stringify({ error: 'owner only' }) };

    // delete action
    if (action === 'delete') {
      if (db) {
        await db.collection('users').deleteOne({ user });
      } else {
        const overrides = globalThis.__codeOverrides || {};
        delete overrides[user];
      }
      return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true }) };
    }

    // add or update
    if (!/^\d{5}$/.test(code)) return { statusCode: 400, body: JSON.stringify({ error: 'code must be 5 digits' }) };
    if (db) {
      await db.collection('users').updateOne(
        { user },
        { $set: { user, code: String(code), role: role || 'slave' } },
        { upsert: true }
      );
    } else {
      if (!globalThis.__codeOverrides) globalThis.__codeOverrides = {};
      globalThis.__codeOverrides[user] = code;
    }
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
