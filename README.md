# moni
Aplicação de gestão financeira pessoal

## Endpoints implementados

### Autenticação (RF01)

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

Contrato de sucesso do login (`200 OK`):

- `token`
- `type`
- `userId`
- `name`

### Transações (RF02)

- `POST /api/v1/transactions` cria transação (requer JWT)
- `GET /api/v1/transactions` lista transações do usuário autenticado (requer JWT)
- `GET /api/v1/transactions?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD` filtra por intervalo
- `GET /api/v1/transactions?mes=M&ano=YYYY` filtra por mês/ano
- `PUT /api/v1/transactions/{id}` atualiza transação (requer JWT e ownership)
- `DELETE /api/v1/transactions/{id}` remove transação (requer JWT e ownership, retorna `204 No Content`)

Campos obrigatórios de transação:

- `descricao`
- `valor`
- `data` (ISO-8601 `YYYY-MM-DD`)
- `tipo` (`RECEITA` ou `DESPESA`)
- `categoria`

## Documentação da API (Swagger / OpenAPI)

Com o backend em execução, acesse:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
