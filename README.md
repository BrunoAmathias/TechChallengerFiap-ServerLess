# TechChallengerFiap-ServerLess

Projeto serverless do TechChallengerFiap, implementado como fun��o JavaScript com Node.js, PostgreSQL e autentica��o JWT. A aplica��o recebe um evento com CPF, valida o documento, consulta o cliente cadastrado no banco e devolve um token de acesso em formato JWT.

## Apresenta��o do projeto

Este reposit�rio cont�m a implementa��o de uma fun��o serverless para autentica��o e consulta de cliente com base em CPF. A l�gica principal est� concentrada no arquivo `index.js` e usa o pacote `pg` para acesso ao PostgreSQL e `jsonwebtoken` para gera��o do token.

O fluxo principal �:

1. Receber um evento contendo `cpf` ou o corpo do JSON do evento.
2. Validar o formato do CPF.
3. Consultar a tabela `clientes` com filtro por `documento` e `tipo_documento = 'CPF'`.
4. Verificar o status do cliente.
5. Emitir um token JWT com dados do cliente e retornar o payload em JSON.

## Funcionalidades

- Valida��o de CPF com regra de documento brasileiro.
- Consulta de cliente por CPF na base PostgreSQL.
- Bloqueio de clientes com `status` ausente.
- Gera��o de token JWT com dura��o padr�o de `24h`.
- Resposta HTTP com status codes para sucesso, falha de valida��o, cliente n�o encontrado e erro interno.
- Suporte a body em JSON bruto ou conte�do convertido do evento de Lambda.

## Tecnologias

| Tecnologia | Versão / Uso |
|---|---|
| Node.js | Runtime da função |
| JavaScript | Linguagem principal |
| PostgreSQL | Banco de dados relacional |
| `pg` | Cliente PostgreSQL |
| `jsonwebtoken` | Criação de tokens JWT |
| AWS Lambda / Serverless | Modelo de execução |
| npm | Gerenciamento de pacotes |

## Arquitetura

A arquitetura deste repositório e minimalista e está centrada em uma única função exportada pelo arquivo `index.js`.

```text
Evento HTTP/Serverless -> index.js -> validarCPF() -> query PostgreSQL -> gerar JWT -> retorno JSON
```

A fun��o recebe um evento e tenta interpretar o corpo do evento como JSON quando o campo `body` existe. O resultado � retornado com `statusCode`, `headers` e `body` no formato JSON serializado.

## Estrutura de pastas

```text
TechChallengerFiap-ServerLess/
+-- index.js
+-- package.json
+-- README.md
```

## Instala��o

Pr�-requisitos:

- Node.js
- npm
- Uma instância PostgreSQL acessível por `DATABASE_URL`
- `JWT_SECRET` configurado no ambiente

Clone o projeto:

```bash
git clone [PREENCHER]
cd TechChallengerFiap-ServerLess
```

Instale as dependências:

```bash
npm install
```

## Configura��o das vari�veis de ambiente

A aplica��o usa vari�veis de ambiente diretamente em `index.js`:

```bash
export DATABASE_URL="[PREENCHER]"
export JWT_SECRET="[PREENCHER]"
export JWT_EXPIRES_IN="24h"
```

Vari�veis observadas no código:

- `DATABASE_URL`: string de conexão com o PostgreSQL.
- `JWT_SECRET`: chave privada usada para assinar o token JWT.
- `JWT_EXPIRES_IN`: duração opcional de expiração do token; o padrão é `24h`.

## Execu��o local

Este repositório n�o possui script de execu��o local definido em `package.json`.

Para executar a fun��o com um evento local, � poss�vel usar um exemplo de invoca��o por Node.js ou adaptar o projeto para um ambiente de Lambdas conforme a plataforma alvo.

Exemplo de teste local: 

```bash
node -e "const fn = require('./index').handler; fn({ body: JSON.stringify({ cpf: '12345678909' }) }).then(console.log).catch(console.error)"
```

> Ajuste o ambiente com `DATABASE_URL` e `JWT_SECRET` antes da execu��o.

## Banco de dados

O c�digo utiliza o cliente `pg` para conectar ao PostgreSQL usando `connectionString: process.env.DATABASE_URL` com `ssl.rejectUnauthorized = false`.

A consulta do cliente � feita na tabela `clientes`, com filtro:

```sql
SELECT id, nome, email, documento, status
FROM clientes
WHERE documento = $1
  AND tipo_documento = 'CPF'
LIMIT 1;
```

O banco deve possuir a tabela `clientes` com os campos usados pela consulta, principalmente `id`, `nome`, `email`, `documento`, `status` e `tipo_documento`.

## Testes

N�o h� su�te de testes implementada neste reposit�rio. O arquivo `package.json` define apenas o script:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

Recomenda-se criar testes de integra��o com um banco de dados de teste e validar:

- CPF v�lido e inv�lido
- cliente ativo e inativo
- cliente inexistente
- retorno de token JWT correto
- respostas `statusCode` esperadas

## Exemplos de uso

### Exemplo de payload de entrada

```json
{
  "body": "{\"cpf\":\"12345678909\"}"
}
```

### Exemplo de resposta bem-sucedida

```json
{
  "access_token": "[JWT]",
  "token_type": "Bearer",
  "expires_in": "24h",
  "cliente": {
    "id": 1,
    "nome": "[nome]",
    "cpf": "[cpf]"
  }
}
```

### Exemplo de resposta de CPF inv�lido

```json
{
  "message": "CPF inv�lido"
}
```

## Deploy

O reposit�rio n�o inclui manifest de deployment para AWS Lambda ou infraestrutura serverless espec�fica. O projeto est� estruturado para ser adaptado a uma fun��o serverless, com foco na l�gica de autentica��o e consulta por CPF.

Usos t�picos:

```bash
# Exemplo gen�rico de deploy em plataforma serverless
[PREENCHER]
```

## Contribuições

Contribui��es s�o bem-vindas por meio de branchs e pull requests. Os pontos de cuidado principais s�o:

- manter o fluxo de valida��o de CPF consistente;
- preservar o uso seguro da vari�vel `JWT_SECRET`;
- manter os campos de resposta compat�veis com o consumidor da API;
- testar o comportamento em ambientes com PostgreSQL configurado.

