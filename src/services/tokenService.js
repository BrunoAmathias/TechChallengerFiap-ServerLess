const jwt = require('jsonwebtoken');
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({});
let cachedJwtSecret = null;

const TOKEN_TTL_SECONDS = parseInt(process.env.JWT_TTL_SECONDS || '3600', 10);
const ISSUER = process.env.JWT_ISSUER || 'workshop-auth-lambda';

async function getJwtSecret() {
  if (cachedJwtSecret) return cachedJwtSecret;

  const secretId = process.env.JWT_SECRET_ARN;
  if (!secretId) {
    throw new Error('JWT_SECRET_ARN não configurado nas variáveis de ambiente');
  }

  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await secretsClient.send(command);
  // Secret armazenado como texto puro (uma chave aleatória de 256+ bits)
  cachedJwtSecret = response.SecretString;
  return cachedJwtSecret;
}

async function generateToken({ clientId, cpf, status }) {
  const secret = await getJwtSecret();

  const payload = {
    sub: clientId,
    cpf,
    status,
  };

  const token = jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: TOKEN_TTL_SECONDS,
    issuer: ISSUER,
  });

  return { token, expiresIn: TOKEN_TTL_SECONDS };
}

async function verifyToken(token) {
  const secret = await getJwtSecret();
  // Lança se inválido/expirado — quem chama decide como tratar
  return jwt.verify(token, secret, { algorithms: ['HS256'], issuer: ISSUER });
}

module.exports = { generateToken, verifyToken };
