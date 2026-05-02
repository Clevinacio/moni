# Reorganizacao Frontend Angular - 2026-03-16

## Objetivo

Reorganizar o frontend para aderir ao padrao de pastas solicitado:

- core/
- shared/
- features/
- models/
- store/

Com foco em:

- Angular standalone
- Lazy loading por feature
- State com signals
- Templates separados em HTML
- Estilizacao com Tailwind
- Compatibilidade com contratos RF01

## Estrutura resultante (resumo)

```text
frontend/src/app/
├── core/
│   ├── guards/
│   └── interceptors/
├── shared/
│   └── utils/
├── models/
├── store/
│   └── auth/
├── features/
│   ├── inicial/
│   │   ├── inicial.routes.ts
│   │   └── pages/
│   │       └── inicial/
│   ├── nao-encontrada/
│   │   ├── nao-encontrada.routes.ts
│   │   └── pages/
│   │       └── nao-encontrada/
│   └── auth/
│       ├── auth.routes.ts
│       ├── auth.ts
│       ├── auth.html
│       ├── service/
│       │   ├── servico-autenticacao.ts
│       │   └── sessao-autenticacao-storage.ts
│       ├── ui/
│       │   └── cabecalho-auth/
│       └── pages/
│           ├── login/
│           ├── cadastro/
│           └── painel/
```

## Decisoes aplicadas

- Nomenclatura hibrida: pastas em ingles, simbolos principais em portugues (ex.: PaginaLogin).
- Templates separados por arquivo (templateUrl), sem CSS local novo de componente.
- Conversao visual das telas de autenticacao para classes utilitarias Tailwind.
- Rotas de auth movidas para arquivo dedicado com lazy loading.
- Feature auth possui container raiz (`auth.ts` + `auth.html`) para hospedar as paginas via child routes.
- Services especificos da feature auth movidos para `features/auth/service`.
- Componentizacao granular de auth concentrada em `features/auth/ui`.
- Rotas de inicio e nao-encontrada migradas para features dedicadas com lazy loading.
- Guard de autenticacao para rota de painel.
- Interceptor de token para requisicoes de API relativas (/api/*).

## Compatibilidade de testes RF01

Para manter os contratos de pagina com `templateUrl` e import dinamico, os testes usam:

- `ɵresolveComponentResources`
- resolver customizado com `readFile('src/app/features/auth/pages/...')`

Isso evita regressao no ambiente Vitest sem servidor HTTP para assets.

## Validacao executada

- Build: `npm run build -- --configuration development`
- Testes: `npm run test -- --watch=false`
- Resultado final: build OK, 21/21 testes passando.

## Comandos de scaffolding usados

- ng g component pages/inicial --style none --skip-tests --change-detection OnPush
- ng g component pages/nao-encontrada --style none --skip-tests --change-detection OnPush
- ng g component features/auth/pages/login --style none --skip-tests --change-detection OnPush
- ng g component features/auth/pages/cadastro --style none --skip-tests --change-detection OnPush
- ng g component features/auth/pages/painel --style none --skip-tests --change-detection OnPush
- ng g service features/auth/service/servico-autenticacao --skip-tests
- ng g service features/auth/service/sessao-autenticacao-storage --skip-tests
- ng g component features/auth/ui/cabecalho-auth --inline-template --skip-tests --change-detection OnPush
- ng g guard core/guards/auth --skip-tests
- ng g interceptor core/interceptors/auth-token --skip-tests
- ng g service store/auth/auth-store --skip-tests

## Atualizacao 2026-03-24

### Navegacao e painel central

- Rota protegida principal consolidada em `/painel`.
- Compatibilidade mantida para caminho legado `/auth/painel` com redirecionamento para `/painel`.
- Fluxo pos-autenticacao atualizado para redirecionar automaticamente:
	- Login concluido com sucesso -> `/painel`
	- Cadastro concluido com sucesso -> `/painel`
- Painel evoluido para hub central com:
	- Funcionalidades atuais: Painel inicial, Transacoes, Resumo inicial
	- Funcionalidades futuras: Metas, Faturas, Notificacoes (estado "Em breve")
	- Acao de sair com limpeza de sessao e navegacao para login

### Responsividade e acessibilidade

- Breakpoint adicional de `720px` adicionado no Tailwind (`tablet`) para melhor distribuicao horizontal em desktop.
- Containers principais ampliados para ocupar maior largura horizontal em telas maiores.
- Lista de transacoes em desktop reforcada com regiao rolavel acessivel:
	- `role="region"`
	- `aria-label` descritivo
	- `tabindex="0"` para foco por teclado
- Filtros de transacoes com rotulos e `aria-label` mais claros.

### Padronizacao PT-BR

- Idioma do documento atualizado para `pt-BR` em `frontend/src/index.html`.
- Revisao de nomenclatura e acentuacao aplicada nas telas principais:
	- autenticacao
	- painel
	- inicial
	- transacoes (pagina, filtros e lista)
	- nao-encontrada
- Mensagens de erro/sucesso em componentes e servicos ajustadas para PT-BR correto.

### Validacao

- Build executado com sucesso: `npm run build`.
- Testes automatizados nao executados neste ciclo, pois a execucao foi pulada no ambiente atual.

## Atualizacao 2026-03-24 (Redesign do Painel)

### Escopo aplicado

- A rota `/painel` foi redesenhada para refletir os prototipos desktop e mobile com alta fidelidade visual.
- O layout passou a ter:
	- Sidebar lateral no desktop com navegacao principal.
	- Topbar com saudacao e atalho de notificacoes.
	- Barra inferior fixa no mobile.
	- Cards principais de saldo, receitas, despesas, gastos por categoria, metas e contas pendentes.
- As cores e nomenclaturas foram mantidas dentro do padrao oficial (`brand`, `brand-dark`, `brand-light`, `background`).

### Dados exibidos

- Bloco financeiro (saldo, receitas e despesas): dados reais agregados a partir de `ServicoTransacoes#listar`.
- Bloco "Meus Gastos": distribuicao de despesas por categoria com grafico donut via `conic-gradient` (sem biblioteca externa).
- Blocos "Metas" e "Proximas Contas": dados mock controlados para aproximacao visual ao prototipo, conforme decisao de escopo.

### Acessibilidade e responsividade

- Mantidos estados de foco visivel (`focus-visible:outline-*`) e alvos de toque com altura minima adequada.
- Composicao mobile-first com adaptacao para `tablet` e `lg`.
- Estrutura semantica com `header`, `nav`, `aside`, mensagens com `role` e `aria-live`.

### Testes e validacao

- Novo teste de contrato para o painel:
	- `frontend/src/app/features/auth/paginaPainelContrato.spec.ts`
	- Cobertura de calculo de saldo/receitas/despesas e total pendente mock.
- Execucoes realizadas:
	- `npm run test` -> 7 arquivos de teste, 41 testes passando.
	- `npm run build` -> build concluido com sucesso.

## Atualizacao 2026-04-09 (Rota raiz e login desktop)

### Navegacao da rota raiz

- A rota raiz `/` deixou de usar redirecionamento fixo para login e passou a usar decisao condicional por sessao:
	- Sem sessao/token: `/` -> `/auth/login`
	- Com sessao/token: `/` -> `/painel`
- Implementacao com componente standalone de redirecionamento:
	- `frontend/src/app/core/redirect/root-redirect.ts`
- Integracao de rota atualizada em:
	- `frontend/src/app/app.routes.ts`

### Controle de acesso ao login

- Usuario autenticado tentando acessar `/auth/login` agora e redirecionado para `/painel`.
- Implementacao por guard funcional aplicado na rota de login:
	- `frontend/src/app/core/guards/nao-autenticado-guard.ts`
	- `frontend/src/app/features/auth/auth.routes.ts`

### Layout desktop da autenticacao

- Container de autenticacao ajustado para centralizacao vertical no desktop.
- Botao de alternancia de tema posicionado no canto superior direito no desktop, com espacamento da borda da viewport.
- Ajustes aplicados no template do container:
	- `frontend/src/app/features/auth/auth.html`

### Testes e validacao

- Novo teste de contrato para o redirecionamento da raiz:
	- `frontend/src/app/core/redirect/root-redirect.spec.ts`
	- Cobre ambos os cenarios: com token e sem token.
- Novo teste para bloqueio de login quando autenticado:
	- `frontend/src/app/core/guards/nao-autenticado-guard.spec.ts`
	- Cobre ambos os cenarios: permite login sem sessao e redireciona para painel com sessao.
- Execucao de testes frontend:
	- `npm run test` executado anteriormente nesta sessao com suite verde (59 testes).
	- Novo spec de redirecionamento validado sem erros de TypeScript/template no workspace.
- Validacao de problemas no workspace:
	- sem erros de TypeScript/template nos arquivos alterados.
