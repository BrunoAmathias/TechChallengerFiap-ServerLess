resource "aws_security_group" "lambda_sg" {
  name        = "${local.name_prefix}-auth-cpf-lambda-sg"
  description = "SG das lambdas de autenticacao - saida liberada para RDS Proxy/Secrets Manager"
  vpc_id      = var.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

locals {
  common_env = {
    DB_HOST         = var.db_host
    DB_PORT         = tostring(var.db_port)
    DB_NAME         = var.db_name
    DB_SECRET_ARN   = var.db_secret_arn
    JWT_SECRET_ARN  = var.jwt_secret_arn
    JWT_TTL_SECONDS = tostring(var.jwt_ttl_seconds)
    JWT_ISSUER      = "${var.project_name}-auth-lambda"
  }
}

# Pacote é gerado pelo CI (npm run package) e referenciado aqui.
# Em terraform apply local, aponta para o zip já buildado em dist/.
resource "aws_lambda_function" "auth_cpf" {
  function_name = "${local.name_prefix}-auth-cpf"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "src/handlers/authHandler.handler"
  runtime       = "nodejs20.x"
  timeout       = 10
  memory_size   = 256

  filename         = "${path.module}/../dist/function.zip"
  source_code_hash = filebase64sha256("${path.module}/../dist/function.zip")

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = local.common_env
  }
}

resource "aws_lambda_function" "jwt_authorizer" {
  function_name = "${local.name_prefix}-jwt-authorizer"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "src/handlers/authorizerHandler.handler"
  runtime       = "nodejs20.x"
  timeout       = 5
  memory_size   = 128

  filename         = "${path.module}/../dist/function.zip"
  source_code_hash = filebase64sha256("${path.module}/../dist/function.zip")

  environment {
    variables = {
      JWT_SECRET_ARN = var.jwt_secret_arn
      JWT_ISSUER     = "${var.project_name}-auth-lambda"
    }
  }
}

resource "aws_cloudwatch_log_group" "auth_cpf_logs" {
  name              = "/aws/lambda/${aws_lambda_function.auth_cpf.function_name}"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "authorizer_logs" {
  name              = "/aws/lambda/${aws_lambda_function.jwt_authorizer.function_name}"
  retention_in_days = 30
}
