resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api-gateway"
  protocol_type = "HTTP"
  description   = "API Gateway - roteamento e autenticacao por CPF"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw_access_logs.arn
    # Log em JSON estruturado, com requestId para correlacionar com os logs
    # das lambdas e da aplicação principal (item de observabilidade).
    format = jsonencode({
      requestId        = "$context.requestId"
      ip                = "$context.identity.sourceIp"
      requestTime       = "$context.requestTime"
      httpMethod        = "$context.httpMethod"
      routeKey          = "$context.routeKey"
      status            = "$context.status"
      protocol          = "$context.protocol"
      responseLength    = "$context.responseLength"
      integrationLatency = "$context.integrationLatency"
      integrationError  = "$context.integrationErrorMessage"
    })
  }

  default_route_settings {
    throttling_burst_limit = 50
    throttling_rate_limit  = 25
  }
}

resource "aws_cloudwatch_log_group" "api_gw_access_logs" {
  name              = "/aws/apigateway/${local.name_prefix}-api-gateway"
  retention_in_days = 30
}

# --- Rota pública: emissão do token ---

resource "aws_apigatewayv2_integration" "auth_cpf" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.auth_cpf.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds    = 10000
}

resource "aws_apigatewayv2_route" "auth_cpf" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /auth/cpf"
  target    = "integrations/${aws_apigatewayv2_integration.auth_cpf.id}"
  # Rota pública - sem authorizer, é aqui que o cliente troca CPF por token
}

resource "aws_lambda_permission" "allow_apigw_invoke_auth" {
  statement_id  = "AllowAPIGatewayInvokeAuth"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_cpf.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# --- Authorizer JWT, para proteger as demais rotas ---

resource "aws_apigatewayv2_authorizer" "jwt_authorizer" {
  api_id                            = aws_apigatewayv2_api.main.id
  authorizer_type                   = "REQUEST"
  name                               = "${local.name_prefix}-jwt-authorizer"
  authorizer_uri                    = aws_lambda_function.jwt_authorizer.invoke_arn
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  identity_sources                  = ["$request.header.Authorization"]
  authorizer_result_ttl_in_seconds  = 60 # cache de 60s do resultado por token
}

resource "aws_lambda_permission" "allow_apigw_invoke_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jwt_authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# As rotas protegidas (ex: ANY /os/{proxy+} -> aplicação principal no EKS,
# via VPC Link para um NLB interno) serão adicionadas quando o repositório
# da aplicação principal e o VPC Link existirem. Ficam assim, referenciando
# este authorizer_id pelo output abaixo:
#
# resource "aws_apigatewayv2_route" "os_protected" {
#   api_id             = aws_apigatewayv2_api.main.id
#   route_key          = "ANY /os/{proxy+}"
#   target             = "integrations/<id-da-integracao-com-vpc-link>"
#   authorization_type = "CUSTOM"
#   authorizer_id      = aws_apigatewayv2_authorizer.jwt_authorizer.id
# }
