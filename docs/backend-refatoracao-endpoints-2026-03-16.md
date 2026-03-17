# Refatoracao Backend de Endpoints - 2026-03-16

## Objetivo

Aplicar concentracao de endpoints por controller no RF01 (autenticacao), adotando o padrao de interface de contrato + controller implementador.

## Escopo

Incluido:

- RF01 (auth): `POST /api/v1/auth/register` e `POST /api/v1/auth/login`
- Refatoracao estrutural sem alteracao funcional do contrato HTTP
- Reuso de constante de rota publica de auth no `SecurityConfig`

Excluido:

- Implementacao de novos endpoints de RF02-RF07
- Mudancas de payload, codigos HTTP, regras de negocio e formato de erro

## Alteracoes aplicadas

1. Criada interface de contrato de endpoints:

- Arquivo: `backend/src/main/java/com/moni/controller/AutenticacaoEndpoints.java`
- Define:
  - `ROTA_BASE = "/api/v1/auth"`
  - `ROTA_PUBLICA = "/api/v1/auth/**"`
  - assinaturas de `cadastrar` e `login`
  - anotacoes de mapeamento e documentacao OpenAPI nos metodos

2. Refatorado controller de autenticacao:

- Arquivo: `backend/src/main/java/com/moni/controller/AutenticacaoController.java`
- Agora implementa `AutenticacaoEndpoints`
- Mantido comportamento:
  - `cadastrar` retorna `201 Created`
  - `login` retorna `200 OK`

3. Alinhada configuracao de seguranca:

- Arquivo: `backend/src/main/java/com/moni/configuration/SecurityConfig.java`
- `requestMatchers` passa a usar `AutenticacaoEndpoints.ROTA_PUBLICA`
- Swagger/OpenAPI continua publico

## Validacao executada

1. Testes focados de autenticacao:

- Comando: `cd backend && ./mvnw -Dtest='*Autenticacao*' test`
- Resultado: 25 testes executados, 0 falhas

2. Suite backend completa:

- Comando: `cd backend && ./mvnw clean test`
- Resultado: 26 testes executados, 0 falhas

## Resultado

A concentracao de endpoints por controller foi aplicada no RF01 com padrao de contrato por interface, preservando compatibilidade de API e estabilidade dos testes.
