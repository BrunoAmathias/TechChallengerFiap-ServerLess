const { getPool } = require('../config/db');

/**
 * Busca o cliente pelo CPF (armazenado apenas com dígitos no banco).
 * Retorna null se não existir.
 */
async function findClientByCpf(cpfDigits) {
  const pool = await getPool();

  const query = `
    SELECT id, nome, cpf, status, email
    FROM clientes
    WHERE cpf = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [cpfDigits]);
  return rows[0] || null;
}

const ACTIVE_STATUSES = new Set(['ATIVO', 'ACTIVE']);

function isClientActive(client) {
  if (!client) return false;
  return ACTIVE_STATUSES.has(String(client.status || '').toUpperCase());
}

module.exports = { findClientByCpf, isClientActive };
