const { isValidCPF, onlyDigits } = require('../services/cpfValidator');
const { findClientByCpf, isClientActive } = require('../services/clientRepository');
const { generateToken } = require('../services/tokenService');
const { createLogger } = require('../utils/logger');

function respond(statusCode, body, correlationId) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
    },
    body: JSON.stringify(body),
  };
}

/**
 * POST /auth/cpf
 * Body: { "cpf": "123.456.789-09" }
 *
 * Fluxo:
 *  1. Valida formato + dígitos verificadores do CPF
 *  2. Consulta o cliente na base
 *  3. Verifica se o cliente existe e está ativo
 *  4. Gera e devolve um JWT
 */
exports.handler = async (event) => {
  const correlationId =
    event.requestContext?.requestId || event.headers?.['x-correlation-id'] || 'unknown';
  const logger = createLogger(correlationId);

  try {
    const body = JSON.parse(event.body || '{}');
    const rawCpf = body.cpf;

    if (!rawCpf) {
      logger.warn('Requisição sem CPF');
      return respond(400, { error: 'CPF é obrigatório' }, correlationId);
    }

    if (!isValidCPF(rawCpf)) {
      logger.warn('CPF com formato ou dígitos verificadores inválidos');
      return respond(400, { error: 'CPF inválido' }, correlationId);
    }

    const cpfDigits = onlyDigits(rawCpf);
    const client = await findClientByCpf(cpfDigits);

    if (!client) {
      logger.warn('CPF válido mas cliente não encontrado');
      // 404 aqui vaza que o CPF não existe na base — em produção,
      // considere responder 401 genérico por segurança (evitar enumeração).
      return respond(404, { error: 'Cliente não encontrado' }, correlationId);
    }

    if (!isClientActive(client)) {
      logger.warn('Cliente encontrado mas inativo', { clientId: client.id });
      return respond(403, { error: 'Cliente inativo, acesso negado' }, correlationId);
    }

    const { token, expiresIn } = await generateToken({
      clientId: client.id,
      cpf: cpfDigits,
      status: client.status,
    });

    logger.info('Token emitido com sucesso', { clientId: client.id });

    return respond(200, { token, tokenType: 'Bearer', expiresIn }, correlationId);
  } catch (err) {
    logger.error('Erro inesperado ao processar autenticação', {
      error: err.message,
      stack: err.stack,
    });
    return respond(500, { error: 'Erro interno' }, correlationId);
  }
};
