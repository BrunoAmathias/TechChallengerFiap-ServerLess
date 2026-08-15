const { Pool } = require('pg');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({});

// Cache no escopo do módulo: sobrevive entre invocações em uma mesma
// execution environment (Lambda "warm start"), evitando reabrir conexões
// e refazer chamadas ao Secrets Manager a cada request.
let cachedPool = null;
let cachedSecret = null;

async function getDbSecret() {
  if (cachedSecret) return cachedSecret;

  const secretId = process.env.DB_SECRET_ARN;
  if (!secretId) {
    throw new Error('DB_SECRET_ARN não configurado nas variáveis de ambiente');
  }

  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await secretsClient.send(command);
  cachedSecret = JSON.parse(response.SecretString);
  return cachedSecret;
}

async function getPool() {
  if (cachedPool) return cachedPool;

  const secret = await getDbSecret();

  cachedPool = new Pool({
    host: process.env.DB_HOST, // idealmente o endpoint do RDS Proxy, não do RDS direto
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: secret.username,
    password: secret.password,
    max: 2, // Lambda + RDS Proxy: manter baixo, o proxy cuida do pooling real
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: { rejectUnauthorized: false },
  });

  return cachedPool;
}

module.exports = { getPool };
