---
description: General Overview about the project, its specifications and use cases in Brazilian Portuguese
applyTo: "**"
---

## Visão Geral

O **Moni** é um gerenciador financeiro pessoal focado em fluxo de caixa, acompanhamento de metas e alertas de vencimento. O projeto prioriza uma **interface limpa**, **acessibilidade extrema** (WCAG 2.1 AA) e uma experiência **Mobile-First**.

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
├── frontend/
    ├── core/                     # Singleton Services (Auth, Interceptors, Guards)
    ├── models/                   # Interfaces TS (Contratos da API)
    ├── shared/                   # Componentes UI reusáveis e acessíveis
    │   ├── components/           # Button, Input, Modal (foco em ARIA e 44px)
    │   └── ui/                   # Layouts básicos (Shell, Navbar)
    └── features/                 # Módulos de Negócio (Lazy Loaded)
        └── feature/              # Exemplo de feature module
            ├── services/         # Services específicos da feature
            ├── ui/               # Componentes específicos da feature
            ├── feature.ts        # Componente do container Angular Standalone da feature
            └── feature.routes.ts # Rotas da feature
└── docker-compose.yml            # Infraestrutura (Postgres)

```

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

## Contexto geral

- Utilize o arquivo SCRATCHPAD.md para anotações e rascunhos.
- Sempre que for necessário, atualize o arquivo SCRATCHPAD.md com suas anotações e rascunhos.
- O arquivo .github/instructions/instructions.md contém o histórico completo e regras legadas. Não o leia por padrão. Consulte-o apenas se eu solicitar explicitamente uma análise de escopo global ou se houver dúvida sobre uma regra de negócio não coberta nos arquivos de .rules.
- A pasta docs deve ser sempre atualizada com as funcionalidades implementadas, com diagramas, contratos de API, etc. Caso uma funcionalidade com documentação exista, atualizar o arquivo correspondente na pasta docs.
- Após cada implementação realize as seguintes verificações:
    - [ ] Código segue as convenções de estilo e padrões do projeto.
    - [ ] Verificação de acessibilidade (WCAG 2.1 AA) concluída.
    - [ ] Testes unitários e de integração escritos passam com sucesso.
    - [ ] Build do projeto passando
    - [ ] Documentação atualizada (README, Swagger/OpenAPI).
    - [ ] Arquivo na pasta docs/ para a funcionalidade implementada criado ou atualizado, versionando atualizações significativas.
    - [ ] Mensagem de commit clara e descritiva, seguindo o padrão Conventional Commits.