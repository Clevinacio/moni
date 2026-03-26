# RF04 - Backend: Integracao Receita -> Metas (2026-03-26)

## Escopo implementado (Fases 0-2)
- Inclusao de `meta_id` opcional em transacoes.
- Criacao do dominio de metas (`Meta`) com CRUD via API.
- Centralizacao da logica de impacto no saldo no `TransacaoService`.
- Persistencia de notificacao interna quando meta e atingida.
- Ajuste de contratos de transacao para retornar `metaId` opcional.

## Regras de negocio aplicadas
- `metaId` so pode ser usado em transacoes do tipo `RECEITA`.
- Ao criar/atualizar/excluir transacao vinculada a meta:
  - aporte e revertido/aplicado em `valorPoupado` da meta de forma atomica;
  - ao atingir a meta no aporte, uma notificacao interna e criada.
- Ao excluir uma meta, transacoes permanecem e `meta_id` vira `NULL` (FK `ON DELETE SET NULL`).
- Receitas sem `metaId` mantem comportamento anterior.

## API adicionada
Base: `/api/v1/goals`

- `POST /api/v1/goals`
- `GET /api/v1/goals`
- `GET /api/v1/goals/{id}`
- `PUT /api/v1/goals/{id}`
- `DELETE /api/v1/goals/{id}`

### Contrato principal de Meta
```json
{
  "id": "uuid",
  "nome": "Viagem",
  "valorAlvo": 10000.00,
  "valorPoupado": 2500.00
}
```

### Contrato atualizado de Transacao (response)
```json
{
  "id": "uuid",
  "descricao": "Freelance",
  "valor": 500.00,
  "data": "2026-03-20",
  "tipo": "RECEITA",
  "categoria": "Trabalho",
  "metaId": "uuid-ou-null"
}
```

## Banco de dados (Liquibase)
- `004-criar-tabela-metas.yaml`
- `005-adicionar-meta-id-transacoes.yaml`
- `006-criar-tabela-notificacoes.yaml`

## Componentes backend criados
- Entidades: `Meta`, `Notificacao`, `TipoNotificacao`
- Repositorios: `MetaRepository`, `NotificacaoRepository`
- DTOs: `CriarMetaRequest`, `AtualizarMetaRequest`, `MetaResponse`
- Mapper: `MetaMapper`
- Servicos: `MetaService`, `NotificacaoService`
- Controllers: `MetaEndpoints`, `MetaController`
- Excecao: `MetaNaoEncontradaException`

## Componentes backend alterados
- `Transacao` (relacao opcional com meta)
- `CriarTransacaoRequest` (campo `metaId`)
- `AtualizarTransacaoRequest` (campo `metaId`)
- `TransacaoResponse` (campo `metaId`)
- `TransacaoMapper` (mapeamento `metaId`)
- `TransacaoService` (regras RF04 centralizadas)
- `GlobalExceptionHandler` (handler para meta nao encontrada)
- `db.changelog-master.yaml` (inclusao dos novos changelogs)

## Testes (TDD)
- Novos testes unitarios: `MetaServiceTest`
- Novos testes de contrato API: `MetaContratoApiTest`
- Expansao de testes unitarios: `TransacaoServiceTest`
- Ajuste de contrato de transacao: `TransacaoContratoApiTest`

## Validacao executada
Comando:
- `cd backend && ./mvnw test`

Resultado:
- Build SUCCESS
- Todos os testes passando
