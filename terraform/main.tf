terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Recomendado: backend remoto (S3 + DynamoDB lock) para não versionar
  # o state e evitar o problema de tfstate/tfvars indo pro histórico do git
  # (esse mesmo ponto apareceu nas auditorias anteriores do projeto principal).
  backend "s3" {
    # preencher via -backend-config no CI, um bucket/key por ambiente
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Repo        = "lambda-auth-cpf"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
