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

---

# Atualizacao Frontend RF02 - 2026-03-24

## Objetivo da atualizacao

Evoluir a experiencia visual das features autenticadas com foco em transacoes, mantendo o contrato funcional e os dados existentes.

## Mudancas implementadas

1. Shell autenticado compartilhado para painel e transacoes

- Desktop: menu lateral + barra superior unificados
- Mobile: barra superior + navegacao inferior unificadas
- Rotas cobertas nesta etapa: `/painel` e `/transacoes`

2. Reorganizacao do painel

- Pagina de painel passou a conter apenas conteudo especifico da feature
- Menu lateral, topo e navegacao inferior foram extraidos para o shell compartilhado
- Remocao do botao flutuante global de adicionar registro

3. Rework da tela de transacoes

- Layout atualizado para ficar proximo aos prototipos, preservando paleta atual
- Inclusao de filtros visuais por tipo (Todos, Receitas, Despesas) no frontend
- Lista reestruturada em grupos por data (Hoje, Ontem ou data formatada)
- Cartoes com hierarquia visual aprimorada e icones Lucide por contexto

## Atualizacao Backend + Frontend RF02 - 2026-03-24 (Categoria reutilizavel)

### Objetivo

Permitir que a categoria de uma transacao seja:

- selecionada entre categorias ja existentes do usuario, ou
- criada como nova no mesmo formulario de transacao.

Regra obrigatoria: nunca salvar transacao sem categoria.

### Contrato atualizado de transacoes

Base: `/api/v1/transactions`

Payload de `POST` e `PUT`:

- `descricao`
- `valor`
- `data`
- `tipo`
- `categoria` (objeto)
  - modo existente: `{ "id": "uuid" }`
  - modo nova: `{ "nome": "Nova Categoria" }`

Regras de validacao:

- `categoria` e obrigatoria.
- Deve conter exatamente um entre `id` ou `nome`.
- `id` de categoria de outro usuario retorna `403`.

Resposta de transacao permanece:

- `id`, `descricao`, `valor`, `data`, `tipo`, `categoria` (nome da categoria)

### Novo endpoint de categorias

Base: `/api/v1/categories`

1. `GET /api/v1/categories`

- Status: `200 OK`
- Lista somente categorias do usuario autenticado
- Contrato de resposta:
  - `id`
  - `nome`

### Implementacao backend

Arquivos principais:

- `backend/src/main/java/com/moni/dto/CategoriaTransacaoRequest.java`
- `backend/src/main/java/com/moni/dto/CriarTransacaoRequest.java`
- `backend/src/main/java/com/moni/dto/AtualizarTransacaoRequest.java`
- `backend/src/main/java/com/moni/dto/CategoriaResponse.java`
- `backend/src/main/java/com/moni/controller/CategoriaEndpoints.java`
- `backend/src/main/java/com/moni/controller/CategoriaController.java`
- `backend/src/main/java/com/moni/service/CategoriaService.java`
- `backend/src/main/java/com/moni/service/TransacaoService.java`
- `backend/src/main/java/com/moni/entity/CategoriaRepository.java`

### Implementacao frontend

Arquivos principais:

- `frontend/src/app/models/transacao.models.ts`
- `frontend/src/app/features/transacoes/service/servico-transacoes.ts`
- `frontend/src/app/features/transacoes/service/servico-categorias.ts`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.ts`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.html`

Comportamento de UI no formulario de transacao:

- Campo de categoria em `select` (dropdown) por padrao.
- Botao `Nova categoria` ao lado do dropdown.
- Ao alternar, o dropdown vira input de texto obrigatorio no mesmo formulario.
- Ao salvar com sucesso, categorias sao recarregadas para reutilizacao imediata.

### Testes e validacao executados

Backend:

- `mvnw -f backend/pom.xml test -Dtest=TransacaoServiceTest,TransacaoContratoApiTest,CategoriaContratoApiTest`
  - Resultado: `17` testes, `0` falhas.

Frontend:

- `cd frontend && npm run test`
  - Resultado: `42` testes, `0` falhas.
- `cd frontend && npm run build`
  - Resultado: build concluido com sucesso.

Build backend:

- `mvnw -f backend/pom.xml -DskipTests compile`
  - Resultado: sucesso.

4. Acao de adicionar transacao dentro da feature

- Botao de desktop: "Adicionar transacao" no cabecalho da pagina
- Botao mobile: "+" flutuante exclusivo da tela de transacoes

5. Modal de formulario de transacao

- Formulario de criacao/edicao movido para modal (desktop e mobile)
- Mesmas validacoes, mesmos metodos e mesmo payload da implementacao original
- Fluxo de editar item abre o modal ja preenchido

6. Filtros em modal no mobile

- Desktop: filtros permanecem inline
- Mobile: filtros abrem em modal dedicado
- Ambos reutilizam os mesmos handlers (`aplicarFiltroPeriodo`, `aplicarFiltroMensal`, `limparFiltros`)

## Arquivos principais alterados

- `frontend/src/app/shared/components/shell-autenticado/shell-autenticado.ts`
- `frontend/src/app/shared/components/shell-autenticado/shell-autenticado.html`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/features/auth/pages/painel/painel.ts`
- `frontend/src/app/features/auth/pages/painel/painel.html`
- `frontend/src/app/features/transacoes/transacoes.routes.ts`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.ts`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.html`
- `frontend/src/app/features/transacoes/ui/lista-transacoes/lista-transacoes.ts`
- `frontend/src/app/features/transacoes/ui/lista-transacoes/lista-transacoes.html`

## Validacao da atualizacao

1. `npm run test`

- Resultado: 41/41 testes frontend em verde.

## Refinamentos visuais e de navegacao (2026-03-24 - etapa 2)

1. Transacoes

- Filtros de tipo (Todos, Receitas, Despesas) movidos para o bloco de filtros.
- Layout mobile ajustado para card mais compacto e hierarquia visual mais proxima do prototipo.
- Layout desktop reestruturado para formato tabular com colunas (Descricao, Categoria, Data, Valor, Acoes).
- Paginacao funcional local adicionada na visao desktop (anterior, proxima e numeros de pagina).
- Mantido contrato funcional da pagina (metodos de criar, editar, excluir e filtros).

2. Shell autenticado

- Menu lateral desktop ajustado para permanecer fixo durante scroll da pagina.
- Card de saudacao no topo desktop com espaco interno reduzido para remover area vazia abaixo do conteudo.
- Largura util desktop ampliada para melhor uso de telas grandes.

3. Navegacao

- Remocao completa do Resumo Inicial:
  - item removido da navegacao lateral
  - rota `/inicio` removida
  - arquivos da feature `inicial` removidos

## Atualizacao RF02 - Filtro por categoria (2026-03-24)

### Objetivo

Adicionar filtro por categoria na listagem de transacoes, com suporte completo frontend + backend e combinacao com filtros ja existentes.

### Contrato atualizado de listagem

`GET /api/v1/transactions`

Filtros opcionais suportados:

- `dataInicio` + `dataFim`
- `mes` + `ano`
- `categoriaId`

Combinacoes validas:

- `categoriaId` isolado
- `categoriaId` + `dataInicio/dataFim`
- `categoriaId` + `mes/ano`

Comportamento:

- `categoriaId` invalido (nao UUID) retorna `400`.
- `categoriaId` valido sem transacoes para o usuario retorna lista vazia.

### Implementacao backend

Arquivos alterados:

- `backend/src/main/java/com/moni/controller/TransacaoEndpoints.java`
- `backend/src/main/java/com/moni/controller/TransacaoController.java`
- `backend/src/main/java/com/moni/service/TransacaoService.java`
- `backend/src/main/java/com/moni/entity/TransacaoRepository.java`
- `backend/src/test/java/com/moni/transacao/TransacaoContratoApiTest.java`
- `backend/src/test/java/com/moni/transacao/TransacaoServiceTest.java`

### Implementacao frontend

Arquivos alterados:

- `frontend/src/app/models/transacao.models.ts`
- `frontend/src/app/features/transacoes/service/servico-transacoes.ts`
- `frontend/src/app/features/transacoes/ui/filtros-transacoes/filtros-transacoes.ts`
- `frontend/src/app/features/transacoes/ui/filtros-transacoes/filtros-transacoes.html`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.ts`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.html`
- `frontend/src/app/features/transacoes/servicoTransacoesContrato.spec.ts`
- `frontend/src/app/features/transacoes/paginaTransacoesContrato.spec.ts`

### Validacao executada nesta atualizacao

Frontend:

- `npm run test` em `frontend` com sucesso (`46` testes, `0` falhas).

Backend:

- `./mvnw -Dtest=TransacaoServiceTest test` com sucesso (`7` testes, `0` falhas).
- `./mvnw test` permanece com falha por problema preexistente de contexto (`No qualifying bean of type 'com.moni.mapper.AutenticacaoMapper'`), nao relacionado a esta alteracao de filtro.

## Atualizacao RF02 - Unificacao da filtragem (2026-03-24)

### Objetivo

Simplificar a experiencia de filtragem na tela de transacoes, reduzindo a quantidade de acoes e centralizando os controles em um unico bloco reutilizavel.

### Mudancas implementadas

- O filtro de tipo (`Todas`, `Receitas`, `Despesas`) foi movido para dentro do componente de filtros como dropdown.
- Os filtros de data foram simplificados para manter apenas `dataInicio` e `dataFim`.
- Foram removidos os botoes individuais de filtragem (categoria, periodo e mes/ano).
- A tela passou a ter apenas dois botoes de acao no bloco de filtros:
  - `Filtrar`: aplica os filtros preenchidos.
  - `Limpar`: limpa todos os campos, reseta o tipo para `TODAS` e recarrega a listagem completa sem filtros.
- O comportamento ficou consistente entre desktop e modal mobile, reaproveitando o mesmo componente de filtros.

### Comportamento funcional

- O tipo continua sendo filtro visual no frontend (sem envio para o backend nesta etapa).
- Categoria e periodo continuam sendo aplicados via listagem backend, quando informados.
- Periodo so e considerado quando `dataInicio` e `dataFim` estao preenchidos.

### Arquivos alterados nesta atualizacao

- `frontend/src/app/features/transacoes/ui/filtros-transacoes/filtros-transacoes.ts`
- `frontend/src/app/features/transacoes/ui/filtros-transacoes/filtros-transacoes.html`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.ts`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.html`
- `frontend/src/app/features/transacoes/paginaTransacoesContrato.spec.ts`

### Validacao executada

- `cd frontend && npm run test` com sucesso (`46` testes, `0` falhas).
