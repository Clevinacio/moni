---
description: General Overview about the project, its specifications and use cases in Brazilian Portuguese
applyTo: **
---

## Visão Geral

O **Moni** é um gerenciador financeiro pessoal focado em fluxo de caixa, acompanhamento de metas e alertas de vencimento. O projeto prioriza uma **interface limpa**, **acessibilidade extrema** (WCAG 2.1 AA) e uma experiência **Mobile-First**.

---

## tack Técnica e Arquitetura

### **Backend (Core)**

- **Linguagem**: Java 25 (LTS) — Uso obrigatório de _Records_ e _Pattern Matching_.
- **Framework**: Spring Boot 4.0.3.
- **Segurança**: Spring Security + JWT (Autenticação Stateless).
- **Persistência**: Spring Data JPA + Hibernate.
- **Banco de Dados**: PostgreSQL (Padronizado para Desenvolvimento e Produção).
- **Migrations**: Liquibase para versionamento do esquema.

### **Frontend (Interface)**

- **Framework**: Angular 21 (Arquitetura Standalone).
- **Estado**: **Angular Signals** para reatividade granular.
- **Estilização**: Tailwind CSS.
- **Ícones**: Lucide-angular.

---

## Estrutura de Pastas (Monorepo)

```text
moni/
├── backend/                # API REST Spring Boot
│   ├── src/main/java/com/moni/
│   │   ├── controller/     # Controllers (Endpoints)
│   │   ├── service/        # Services (Regras de Negócio)
│   │   ├── entity/         # Entidades JPA e Repositories
│   │   ├── dto/            # Records (Java 25)
│   │   ├── configuration/  # Security, JWT, Configs, Exception Handler
│   │   └── mapper/         # Mappers (MapStruct)
│   └── resources/db/migration/ # Scripts Liquibase
├── frontend/               # SPA Angular
│   ├── src/app/
│   │   ├── core/           # Guards, Interceptors, Auth Services
│   │   ├── shared/         # Componentes UI, Lucide Icons
│   │   ├── features/       # Módulos Lazy Loaded
│   │   ├── models/         # Interfaces TypeScript
│   │   └── store/          # Signals State Management
└── docker-compose.yml      # Infraestrutura (Postgres)

```

---

## Requisitos Funcionais Detalhados (RF)

- **RF01: Autenticação Essencial**:
- O sistema deve permitir o cadastro simplificado com Nome, E-mail e Senha.
- O sistema deve permitir o login para acesso a informações privadas via JWT.

- **RF02: Lançamentos de Transações**:
- O usuário deve poder cadastrar, visualizar, editar e excluir transações.
- Campos obrigatórios: Descrição, Valor, Data, Tipo (Receita/Despesa) e Categoria.

- **RF03: Dashboard Resumo**:
- Exibição do Saldo Atual (Receitas - Despesas).
- Resumo visual do mês atual com Total de Entradas e Saídas.

- **RF04: Visualização por Categoria**:
- Agrupamento automático de despesas por categoria.
- Gráfico (Pizza ou Rosca) para distribuição de gastos.

- **RF05: Metas de Economia**:
- Criação de metas com Nome, Valor Alvo e Valor Já Poupado.
- Exibição de progresso percentual via barra de progresso.

- **RF06: Faturas e Vencimentos**:
- Cadastro de contas a pagar com Data de Vencimento.
- Marcação de status "Pago", atualizando o saldo e gerando transação automática.

- **RF07: Central de Notificações In-App**:
- Área dedicada (ícone de sino) para alertas.
- Geração automática de notificações para faturas vencendo no dia ou atrasadas.

---

## Histórias de Usuário

| ID       | Eu como... | Quero poder...               | Para que eu possa...                       |
| -------- | ---------- | ---------------------------- | ------------------------------------------ |
| **US01** | Usuário    | Criar uma conta e logar      | Manter meus dados financeiros protegidos.  |
| **US02** | Usuário    | Registrar ganhos e gastos    | Saber para onde meu dinheiro está indo.    |
| **US03** | Usuário    | Ver um gráfico de categorias | Identificar cortes de gastos necessários.  |
| **US04** | Usuário    | Acessar notificações         | Visualizar contas que precisam de atenção. |
| **US05** | Usuário    | Acompanhar minhas metas      | Ver o progresso das minhas economias.      |

---

## Contrato da API (v1)

A API segue o padrão RESTful com prefixo `/api/v1`.

### **Autenticação (`/auth`)**

- `POST /register`: Cadastro de novo usuário.
- `POST /login`: Login e retorno de Token JWT.

### **Transações (`/transactions`)**

- `GET /`: Listagem filtrada (data/mês).
- `POST /`: Criação de lançamento.
- `PUT /{id}`: Atualização de transação.
- `DELETE /{id}`: Remoção de transação.

### **Dashboard (`/dashboard`)**

- `GET /summary`: Saldo total e balanço mensal.
- `GET /categories`: Dados para o gráfico de categorias.

### **Faturas e Metas**

- `POST /bills`: Cadastro de faturas.
- `PATCH /bills/{id}/pay`: Baixa de fatura e geração de transação.
- `PATCH /goals/{id}/deposit`: Adição de valor a uma meta.

### **Regras Globais**

1. **Contexto**: O `userId` deve ser extraído do JWT; nunca enviado no corpo do JSON.
2. **Datas**: Padrão ISO-8601 (`YYYY-MM-DD`).
3. **Erros**: Respostas de erro devem incluir `timestamp`, `status`, `erro` e `mensagem`.

---

## Diretrizes para o Agente de Desenvolvimento

1. **TDD**: Escreva testes (JUnit 5 / Jasmine) SEMPRE antes de implementar a funcionalidade.
2. **Records**: Use Records (Java 25) para todos os DTOs.
3. **Signals**: Gerencie o estado no Angular com `signal`, `computed` e `effect`.
4. **Isolamento**: Garanta a validação de `Owner ID` em todas as requisições para proteção de dados.
5. **Acessibilidade**: HTML semântico e atributos ARIA são obrigatórios para conformidade WCAG.
6. **Documentação**: Mantenha o README atualizado com instruções de setup, uso e contribuição.
7. **Commit Messages**: Use mensagens claras e descritivas seguindo o padrão Conventional Commits.
8. **Comentários**: Evite comentários desnecessários; o código deve ser autoexplicativo. Use comentários apenas para explicar "porquês" complexos.
9. **Nomenclatura**: Siga as convenções de nomenclatura do Java e Angular para classes, métodos, variáveis e arquivos. Utilize nomes descritivos e consistentes em pt-br para melhorar a legibilidade do código.
10. **Revisão de Código**: Sempre revise o código antes de commitar, garantindo que ele esteja limpo, eficiente e aderente às diretrizes do projeto. Realize o checklist pós-implementação para assegurar a qualidade do código e a conformidade com os padrões estabelecidos.

### Angular e TypeScript Best Practices

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

#### TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

#### Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

#### Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

##### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

#### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

#### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

#### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

## Checklist pós cada implementação

- [ ] Código segue as convenções de estilo e padrões do projeto.
- [ ] Testes unitários e de integração escritos passam com sucesso.
- [ ] Documentação atualizada (README, comentários, etc.).
- [ ] Mensagem de commit clara e descritiva, seguindo o padrão Conventional Commits.
- [ ] Verificação de acessibilidade (WCAG 2.1 AA) concluída.
