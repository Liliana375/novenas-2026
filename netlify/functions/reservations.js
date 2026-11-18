const { neon } = require('@neondatabase/serverless');
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const reply = (statusCode, payload) => ({ statusCode, headers, body: JSON.stringify(payload) });
const clean = (s, max) => typeof s === 'string' ? s.trim().slice(0, max) : '';
function verify(pin, row) {
  const a = Buffer.from(row.pin_hash, 'hex');
  const b = scryptSync(pin, Buffer.from(row.pin_salt, 'hex'), a.length);
  return timingSafeEqual(a, b);
}
function hash(pin) {
  const salt = randomBytes(16).toString('hex');
  return { salt, digest: scryptSync(pin, Buffer.from(salt, 'hex'), 64).toString('hex') };
}
exports.handler = async (event) => {
  if (!process.env.DATABASE_URL) return reply(500, { error: 'Falta configurar DATABASE_URL en Netlify.' });
  const sql = neon(process.env.DATABASE_URL);
  try {
    if (event.httpMethod === 'GET') {
      const rows = await sql`SELECT day_number, host_name, arrival_time, address FROM novena_reservations ORDER BY day_number`;
      return reply(200, { reservations: rows });
    }
    if (event.httpMethod !== 'POST') return reply(405, { error: 'Método no permitido.' });
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Solicitud inválida.' }); }
    const day = Number(body.day);
    const action = body.action;
    const pin = String(body.pin || '');
    if (!Number.isInteger(day) || day < 16 || day > 24) return reply(400, { error: 'Fecha inválida.' });
    if (!/^[0-9]{4,8}$/.test(pin)) return reply(400, { error: 'Código de 4 a 8 números requerido.' });
    if (action === 'create') {
      const name = clean(body.name, 160), time = clean(body.time, 5), address = clean(body.address, 250);
      if (!name || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !address) return reply(400, { error: 'Completa nombre, hora y dirección.' });
      const { salt, digest } = hash(pin);
      const rows = await sql`INSERT INTO novena_reservations (day_number, host_name, arrival_time, address, pin_salt, pin_hash) VALUES (${day}, ${name}, ${time}, ${address}, ${salt}, ${digest}) ON CONFLICT DO NOTHING RETURNING day_number`;
      if (!rows.length) return reply(409, { error: 'Esta fecha ya fue reservada. Actualiza la página.' });
      return reply(200, { ok: true });
    }
    if (action !== 'update' && action !== 'delete' && action !== 'verify') return reply(400, { error: 'Acción inválida.' });
    const rows = await sql`SELECT * FROM novena_reservations WHERE day_number = ${day}`;
    if (!rows.length) return reply(404, { error: 'Esta reserva ya no existe.' });
    if (!verify(pin, rows[0])) return reply(403, { error: 'Código incorrecto.' });
    if (action === 'verify') return reply(200, { ok: true });
    if (action === 'delete') {
      await sql`DELETE FROM novena_reservations WHERE day_number = ${day} AND pin_hash = ${rows[0].pin_hash}`;
      return reply(200, { ok: true });
    }
    const name = clean(body.name, 160), time = clean(body.time, 5), address = clean(body.address, 250);
    if (!name || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !address) return reply(400, { error: 'Completa nombre, hora y dirección.' });
    await sql`UPDATE novena_reservations SET host_name=${name}, arrival_time=${time}, address=${address}, updated_at=now() WHERE day_number=${day} AND pin_hash=${rows[0].pin_hash}`;
    return reply(200, { ok: true });
  } catch (e) {
    console.error('Reservation error:', e);
    return reply(500, { error: 'Error del servidor. Comprueba la tabla y la conexión a Neon.' });
  }
};
