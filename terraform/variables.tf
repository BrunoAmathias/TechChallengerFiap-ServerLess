variable "aws_region" {
  description = "Região AWS de deploy"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Ambiente (hml, prod)"
  type        = string
}

variable "project_name" {
  description = "Nome do projeto, usado como prefixo dos recursos"
  type        = string
  default     = "workshop"
}

variable "vpc_id" {
  description = "VPC onde a Lambda vai rodar (mesma VPC do RDS/RDS Proxy)"
  type        = string
}

variable "private_subnet_ids" {
  description = "Subnets privadas para a Lambda (precisa de NAT Gateway ou VPC Endpoints)"
  type        = list(string)
}

variable "db_host" {
  description = "Endpoint do RDS Proxy (ou RDS direto)"
  type        = string
}

variable "db_port" {
  type    = number
  default = 5432
}

variable "db_name" {
  type = string
}

variable "db_secret_arn" {
  description = "ARN do secret no Secrets Manager com username/password do banco"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN do secret no Secrets Manager com a chave usada para assinar o JWT (HS256)"
  type        = string
}

variable "jwt_ttl_seconds" {
  type    = number
  default = 3600
}
