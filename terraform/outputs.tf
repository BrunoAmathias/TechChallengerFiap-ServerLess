output "api_endpoint" {
  description = "URL base do API Gateway"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "auth_endpoint" {
  description = "Endpoint completo para troca de CPF por token"
  value       = "${aws_apigatewayv2_stage.default.invoke_url}/auth/cpf"
}

output "authorizer_id" {
  description = "ID do authorizer JWT, para ser referenciado por outras rotas/repos"
  value       = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

output "api_id" {
  value = aws_apigatewayv2_api.main.id
}

output "api_execution_arn" {
  value = aws_apigatewayv2_api.main.execution_arn
}
