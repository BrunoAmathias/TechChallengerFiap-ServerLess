# lambda-auth-cpf

Function Serverless de autenticação por CPF. Um dos 4 repositórios do desafio
(este é o **repositório 1: Lambda**). Responsável por:

1. Validar o CPF recebido (formato + dígitos verificadores);
2. Consultar o cliente na base gerenciada (existência + status);
3. Emitir um JWT (HS256) para consumo das rotas protegidas no API Gateway.

Inclui também o **Lambda Authorizer** que valida esse JWT nas demais rotas.

## Arquitetura

```
Cliente
  │
  │ POST /auth/cpf { cpf }
  ▼
API Gateway (HTTP API)
  │
  ▼
Lambda auth-cpf ──► Secrets Manager (credenciais do RDS)
  │                 └─► RDS Proxy ──► PostgreSQL (tabela clientes)
  │
  └─► Secrets Manager (chave JWT) ──► gera token

Cliente usa o token:
  Authorization: Bearer <token>
  ANY /os/{proxy+}
  ▼
API Gateway ──► Lambda Authorizer (valida JWT) ──► VPC Link ──► EKS (app principal)
```

## Rodando localmente

```bash
npm install
npm test
```

## Provisionando na AWS

Pré-requisitos que precisam existir **antes** do `terraform apply`:
- Um secret no Secrets Manager com `{ "username": "...", "password": "..." }` do banco.
- Um secret no Secrets Manager com uma chave aleatória forte para assinar o JWT
  (ex: `openssl rand -base64 64`).
- VPC + subnets privadas (as mesmas do RDS/RDS Proxy).

```bash
npm run package   # gera dist/function.zip

cd terraform
terraform init -backend-config="bucket=<seu-bucket-state>" \
  -backend-config="key=lambda-auth-cpf/hml/terraform.tfstate" \
  -backend-config="region=sa-east-1" \
  -backend-config="dynamodb_table=<sua-tabela-lock>"

terraform apply \
  -var="environment=hml" \
  -var="vpc_id=vpc-xxxx" \
  -var='private_subnet_ids=["subnet-aaa","subnet-bbb"]' \
  -var="db_host=<endpoint-rds-proxy>" \
  -var="db_name=workshop" \
  -var="db_secret_arn=arn:aws:secretsmanager:..." \
  -var="jwt_secret_arn=arn:aws:secretsmanager:..."
```

## Testando o endpoint

```bash
curl -X POST "$(terraform output -raw auth_endpoint)" \
  -H "Content-Type: application/json" \
  -d '{"cpf": "529.982.247-25"}'
```

## Proteção de branch (main)

Configurar em Settings > Branches (ou via `gh` CLI abaixo) antes do primeiro PR:

```bash
gh api repos/:owner/:repo/branches/main/protection -X PUT \
  -F required_pull_request_reviews[required_approving_review_count]=1 \
  -F enforce_admins=true \
  -F required_status_checks[strict]=true \
  -F 'required_status_checks[contexts][]=test' \
  -F restrictions=null
```

Isso bloqueia commit direto na `main` e exige PR com o job `test` verde.
O deploy automático roda em push nas branches `homolog` (ambiente de
homologação) e `main` (produção) — ver `.github/workflows/deploy.yml`.

## Secrets necessários no GitHub Actions

`AWS_DEPLOY_ROLE_ARN`, `TF_STATE_BUCKET`, `TF_LOCK_TABLE`, `VPC_ID`,
`PRIVATE_SUBNET_IDS`, `DB_HOST`, `DB_NAME`, `DB_SECRET_ARN`, `JWT_SECRET_ARN`.
Recomendado usar OIDC (role assumida, sem access key fixa) — já configurado
no workflow com `aws-actions/configure-aws-credentials`.

## Próximos passos (fora do escopo deste repo)

- Repositório 2: Terraform do cluster Kubernetes (EKS) com HPA.
- Repositório 3: Terraform do banco gerenciado (RDS + RDS Proxy).
- Repositório 4: aplicação principal, com a rota protegida `/os/{proxy+}`
  registrada no mesmo API Gateway via VPC Link, reusando o `authorizer_id`
  exposto no output deste módulo (via remote state ou SSM Parameter Store).
- Trocar HS256 por RS256 é uma opção se quiser usar o JWT authorizer nativo
  do API Gateway (sem Lambda), mas exige um endpoint JWKS — vale um ADR
  próprio para essa decisão.
