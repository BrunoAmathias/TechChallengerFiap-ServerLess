const { verifyToken } = require('../services/tokenService');
const { createLogger } = require('../utils/logger');

/**
 * Lambda Authorizer (REQUEST, formato de resposta simples v2.0) para
 * API Gateway HTTP API. Protege as rotas sensíveis exigindo um JWT
 * válido emitido pela lambda-auth-cpf.
 *
 * Configurar no Terraform como authorizer_type = "REQUEST",
 * authorizer_payload_format_version = "2.0",
 * enable_simple_responses = true.
 */
exports.handler = async (event) => {
  const correlationId = event.requestContext?.requestId || 'unknown';
  const logger = createLogger(correlationId);

  const authHeader = event.headers?.authorization || event.headers?.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Header Authorization ausente ou mal formatado');
    return { isAuthorized: false };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const claims = await verifyToken(token);

    logger.info('Token validado com sucesso', { clientId: claims.sub });

    return {
      isAuthorized: true,
      context: {
        clientId: claims.sub,
        cpf: claims.cpf,
        status: claims.status,
      },
    };
  } catch (err) {
    logger.warn('Token inválido ou expirado', { error: err.message });
    return { isAuthorized: false };
  }
};
