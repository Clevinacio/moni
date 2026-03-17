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
