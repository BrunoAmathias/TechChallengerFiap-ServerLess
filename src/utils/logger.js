/**
 * Logger estruturado em JSON — pré-requisito do item de observabilidade
 * (logs estruturados + correlação entre requisições).
 * O requestId do API Gateway/Lambda é usado como correlationId.
 */

function baseLog(level, message, meta = {}) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'lambda-auth-cpf',
    ...meta,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

function createLogger(correlationId) {
  return {
    info: (message, meta) => baseLog('info', message, { correlationId, ...meta }),
    warn: (message, meta) => baseLog('warn', message, { correlationId, ...meta }),
    error: (message, meta) => baseLog('error', message, { correlationId, ...meta }),
  };
}

module.exports = { createLogger };
