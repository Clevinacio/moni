# Implementacao Backend RF02 - 2026-03-23

## Objetivo

Implementar o backend da RF02 (lancamentos de transacoes), cobrindo cadastro, listagem, atualizacao e exclusao com validacao de ownership por usuario autenticado via JWT.

## Escopo

Incluido:

- CRUD de transacoes em `/api/v1/transactions`
- Filtros de listagem por intervalo de datas (`dataInicio` e `dataFim`)
- Filtro de listagem por mes/ano (`mes` e `ano`)
- Modelagem relacional de categoria em tabela propria (`categorias`)
- Validacoes de ownership (usuario so pode operar nas proprias transacoes)
- Padronizacao de erros (`timestamp`, `status`, `erro`, `mensagem`)
- Testes de contrato HTTP e testes unitarios de service

Excluido:

- Endpoints independentes de categorias
- Features RF03-RF07
- Agregacoes de dashboard

## Contrato da API implementado

Base: `/api/v1/transactions`

1. `POST /api/v1/transactions`

- Status: `201 Created`
- Body de entrada:
  - `descricao` (obrigatorio)
  - `valor` (obrigatorio, maior que zero)
  - `data` (obrigatorio, ISO-8601)
  - `tipo` (obrigatorio: `RECEITA` ou `DESPESA`)
  - `categoria` (obrigatorio)
- Body de saida:
  - `id`, `descricao`, `valor`, `data`, `tipo`, `categoria`

2. `GET /api/v1/transactions`

- Status: `200 OK`
- Lista transacoes do usuario autenticado
- Filtros opcionais:
  - intervalo: `dataInicio` + `dataFim`
  - mensal: `mes` + `ano`

3. `PUT /api/v1/transactions/{id}`

- Status: `200 OK`
- Atualiza transacao existente (com ownership)

4. `DELETE /api/v1/transactions/{id}`

- Status: `204 No Content`
- Exclui transacao existente (com ownership)

## Estrutura tecnica adicionada

- Entidades:
  - `Categoria`
  - `Transacao`
  - `TipoTransacao` (enum)
- Repositories:
  - `CategoriaRepository`
  - `TransacaoRepository`
- DTOs (Records):
  - `CriarTransacaoRequest`
  - `AtualizarTransacaoRequest`
  - `TransacaoResponse`
- Mapper:
  - `TransacaoMapper` (MapStruct)
- Service:
  - `TransacaoService`
- Controller/Contrato:
  - `TransacaoEndpoints`
  - `TransacaoController`
- Seguranca/JWT:
  - `JwtAuthenticationFilter`
  - `JwtService#extrairUsuarioId`
- Exceptions:
  - `TransacaoNaoEncontradaException`
  - `AcessoNegadoException`

## Banco de dados (Liquibase)

1. `002-criar-tabela-categorias.yaml`

- Tabela `categorias`
- FK para `usuarios`
- Unicidade por `usuario_id + nome`

2. `003-criar-tabela-transacoes.yaml`

- Tabela `transacoes`
- FK para `categorias` e `usuarios`
- Indice em `usuario_id + data`

3. Atualizacao do master changelog:

- Inclusao dos changesets `002` e `003` em `db.changelog-master.yaml`

## Regras de ownership

- O `userId` e sempre extraido do JWT (subject)
- O backend nao aceita `userId` no payload
- Atualizar/excluir transacao de outro usuario retorna `403`
- Transacao inexistente retorna `404`

## Testes

1. Contrato HTTP:

- Arquivo: `backend/src/test/java/com/moni/transacao/TransacaoContratoApiTest.java`
- Cobertura:
  - criacao valida e invalidacoes
  - listagem e filtro mensal
  - atualizacao propria
  - proibicao de atualizacao de terceiro
  - exclusao com `204` e segunda exclusao com `404`

2. Unitario de service:

- Arquivo: `backend/src/test/java/com/moni/transacao/TransacaoServiceTest.java`
- Cobertura:
  - criacao com sucesso
  - bloqueio por ownership
  - exclusao de recurso inexistente

## Validacao executada

1. `mvnw.cmd -Dtest=TransacaoContratoApiTest test`

- Resultado: testes da RF02 em verde

2. `mvnw.cmd test`

- Resultado esperado: toda suite backend em verde (incluindo RF01 e RF02)

---

# Implementacao Frontend RF02 - 2026-03-23

## Objetivo

Implementar no Angular a RF02 de transacoes com fluxo completo de cadastro, listagem, edicao, exclusao e filtros (periodo e mes/ano), aderente ao contrato da API e aos padroes visuais/acessibilidade do projeto.

## Escopo Frontend

Incluido:

- Feature lazy loaded em `/transacoes`
- Tela unica com formulario de transacao + listagem + acoes de editar/excluir
- Filtros de listagem por periodo (`dataInicio/dataFim`) e por mes/ano (`mes/ano`)
- Service HTTP com validacao estrita de contrato de resposta
- Store com Angular signals para estado de carregamento, sucesso, erro e edicao
- Testes de contrato RF02 (service e pagina) em TDD

Excluido:

- Dashboard RF03
- Visualizacao agregada por categoria RF04
- UX de autocomplete de categorias (categoria permanece texto livre)

## Estrutura tecnica adicionada (Frontend)

- Roteamento:
  - `frontend/src/app/features/transacoes/transacoes.routes.ts`
  - `frontend/src/app/app.routes.ts` (nova rota lazy `/transacoes`)
- Models:
  - `frontend/src/app/models/transacao.models.ts`
- Service:
  - `frontend/src/app/features/transacoes/service/servico-transacoes.ts`
- Store:
  - `frontend/src/app/store/transacoes/transacoes-store.ts`
- Pagina/Container:
  - `frontend/src/app/features/transacoes/transacoes/transacoes.ts`
  - `frontend/src/app/features/transacoes/pages/transacoes/transacoes.ts`
  - `frontend/src/app/features/transacoes/pages/transacoes/transacoes.html`
- Componentes de UI da feature:
  - `frontend/src/app/features/transacoes/ui/filtros-transacoes/*`
  - `frontend/src/app/features/transacoes/ui/lista-transacoes/*`
- Utilitario de erro:
  - `frontend/src/app/shared/utils/mensagem-erro-transacao.ts`

## Contrato consumido no frontend

Base: `/api/v1/transactions`

- `GET /api/v1/transactions`
- `GET /api/v1/transactions?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`
- `GET /api/v1/transactions?mes=M&ano=YYYY`
- `POST /api/v1/transactions`
- `PUT /api/v1/transactions/{id}`
- `DELETE /api/v1/transactions/{id}`

Payload enviado pelo frontend (POST/PUT):

- `descricao`
- `valor`
- `data`
- `tipo` (`RECEITA` ou `DESPESA`)
- `categoria`

Regra respeitada:

- `userId` nunca e enviado no payload (ownership vem do JWT no backend)

## TDD aplicado

1. RED

- Criados os contratos:
  - `frontend/src/app/features/transacoes/servicoTransacoesContrato.spec.ts`
  - `frontend/src/app/features/transacoes/paginaTransacoesContrato.spec.ts`
- Execucao inicial com falhas esperadas por ausencia de implementacao.

2. GREEN

- Implementados service, store, pagina e componentes da feature.
- Ajustes de contrato de URL/recursos de template para suite ficar verde.

3. REFACTOR

- Remocao de classes duplicadas geradas por scaffold inicial.
- Consolidacao de estado no store de transacoes.
- Extracao de utilitario para mensagens de erro da API.

## Acessibilidade e UI

- Mantido padrao de cores/tokens da paleta oficial (`brand`, `brand-dark`, `brand-light`, `background`, `success`, `error`).
- Controles de acao com `min-h-11` (44px+) para hit area mobile.
- Mensagens de erro com `role="alert"` e `aria-live="assertive"`.
- Mensagens de sucesso com `role="status"` e `aria-live="polite"`.
- Foco visivel em inputs/selects/botoes com `focus-visible:outline-*`.

## Validacao executada (Frontend)

1. `npm run test -- --include src/app/features/transacoes/*.spec.ts`

- Resultado: 18/18 testes RF02 passando.

2. `npm run test`

- Resultado: 39/39 testes frontend passando (RF01 + RF02).

3. `npm run build`

- Resultado: build Angular concluido com sucesso.
