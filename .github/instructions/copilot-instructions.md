---
description: General Overview about the project, its specifications and use cases in Brazilian Portuguese
applyTo: "**"
---

## Visão Geral

O **Moni** é um gerenciador financeiro pessoal focado em fluxo de caixa, acompanhamento de metas e alertas de vencimento. O projeto prioriza uma **interface limpa**, **acessibilidade extrema** (WCAG 2.1 AA) e uma experiência **Mobile-First**.

---

## Stack Técnica e Arquitetura

### **Backend (Core)**

- **Linguagem**: Java 25 (LTS) — Uso obrigatório de _Records_ e _Pattern Matching_.
- **Framework**: Spring Boot 4.0.3.
- **Segurança**: Spring Security + JWT (Autenticação Stateless).
- **Persistência**: Spring Data JPA + Hibernate.
- **Banco de Dados**: PostgreSQL (Padronizado para Desenvolvimento e Produção).
- **Migrations**: Liquibase para versionamento do esquema.
- **Lombok**: Utilize lombok para reduzir boilerplate, mas evite em DTOs e Records para manter clareza.
- **Mapeamento**: MapStruct para conversão entre entidades e DTOs.
- **Swagger/OpenAPI**: Documentação automática da API.

### **Frontend (Interface)**

- **Framework**: Angular 21 (Arquitetura Standalone).
- **Estado**: **Angular Signals** para reatividade granular.
- **Forms**: Reactive Forms para controle total sobre validação e estado.
- **Roteamento**: Lazy Loading para módulos de recursos.
- **Acessibilidade**: HTML semântico, ARIA, e testes com AXE.
- **AngularCLI**: Use Angular CLI para scaffolding e gerenciamento de dependências.
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

### **Regras Globais**

1. **Contexto**: O `userId` deve ser extraído do JWT; nunca enviado no corpo do JSON.
2. **Datas**: Padrão ISO-8601 (`YYYY-MM-DD`).
3. **Erros**: Respostas de erro devem incluir `timestamp`, `status`, `erro` e `mensagem`.

---

## Diretrizes para o Agente de Desenvolvimento

1. **TDD**: Escreva testes (JUnit 5 / Jasmine) SEMPRE antes de implementar a funcionalidade, seguindo a abordagem Test-Driven Development (TDD) para garantir código testável e de alta qualidade.

2. **Implementação Orientada a Testes**: Siga o ciclo Red-Green-Refactor rigorosamente, garantindo que cada teste falhe antes de escrever o código de produção e que o código seja refatorado para manter a qualidade. NÃO REESCREVA OS TESTES.

3. **Commit Messages**: Use mensagens claras e descritivas seguindo o padrão Conventional Commits.

4. **Nomenclatura**: Siga as convenções de nomenclatura com CamelCase para classes, métodos, variáveis, testes e arquivos. Utilize nomes descritivos e consistentes em português do Brasil para melhorar a legibilidade do código.

5. **Comentários**: Evite comentários desnecessários; o código deve ser autoexplicativo. Use comentários apenas para explicar "porquês" complexos.

6. **Acessibilidade**: HTML semântico e atributos ARIA são obrigatórios para conformidade WCAG 2.1 AA.

7. **Documentação**: Mantenha o README atualizado com instruções de setup, uso e contribuição.

8. **Revisão de Código**: Sempre revise o código antes de commitar, garantindo que ele esteja limpo, eficiente e aderente às diretrizes do projeto. Realize o checklist pós-implementação para assegurar a qualidade do código e a conformidade com os padrões estabelecidos.

---

### **Backend (Java + Spring Boot)**

1. **Records**: Use Records (Java 25) para todos os DTOs.

2. **Endpoints**: Siga rigorosamente os contratos de API definidos, utilizando verbos HTTP corretos e retornando códigos de status apropriados. Concentre os contratos em interfaces com anotações de mapeamento e documentação, e mantenha os controllers como implementadores dessas interfaces para garantir clareza e organização.

3. **Segurança de Rotas**: Configure o Spring Security para proteger as rotas, garantindo que apenas usuários autenticados possam acessar os endpoints privados. Utilize JWT para autenticação stateless e valide o `Owner ID` em todas as requisições para garantir que os usuários só possam acessar seus próprios dados. Nas rotas públicas (como autenticação), certifique-se de que estejam corretamente configuradas para permitir acesso sem autenticação.

4. **Isolamento de Dados**: Valide `Owner ID` (extraído do JWT) em todas as requisições para proteção contra acessos não autorizados.

5. **Swagger/OpenAPI**: Documente a API usando Swagger para facilitar integração e testes.

6. **Organização de Componentes**: Mantenha estrutura clara separando Controllers, Services, Entities, DTOs, Mappers e Repositories, seguindo o padrão definido no projeto.

7. **Componentes Reutilizáveis**: Priorize abstração de funcionalidades comuns em Services que possam ser reutilizados em diferentes Controllers.

---

### **Frontend (Angular 21)**

1. **TDD para o Angular**:
   - **Testes de Lógica (Services + Signals)**: Foque em testar Signals e manipulação de dados antes de criar o componente.
   - **Testes de Componente (UI + Acessibilidade)**: Valide requisitos WCAG 2.1 AA e interação do usuário.
   - **Testes de Estado (Store)**: Teste reatividade e comportamento do estado usando Angular Signals, incluindo transição de estados e reatividade de componentes dependentes.

2. **Angular Style Guide**: Siga as melhores práticas recomendadas pelo [Angular Style Guide](https://angular.dev/style-guide), incluindo organização de arquivos, nomenclatura e estrutura de pastas.

3. **Signals**: Gerencie estado com `signal`, `computed` e `effect` para reatividade granular.

4. **Reactive Forms**: Use Reactive Forms para controle total sobre validação e estado em formulários.

5. **Estilização**: Utilize Tailwind CSS para interface limpa e responsiva, seguindo melhores práticas de design e acessibilidade.

6. **Componentes Reutilizáveis**: Crie componentes modulares na pasta `shared/components` (Button, Input, Modal com foco em ARIA e hit area de 44px).

7. **Lazy Loading**: Implemente carregamento lazy de módulos de recursos para otimizar performance.

8. **Organização de Features**: Estruture módulos de negócio em `features/` com Services, Componentes UI e Rotas específicas, seguindo padrão Standalone.

---

## Checklist pós cada implementação

- [ ] Código segue as convenções de estilo e padrões do projeto.
- [ ] Verificação de acessibilidade (WCAG 2.1 AA) concluída.
- [ ] Testes unitários e de integração escritos passam com sucesso.
- [ ] Documentação atualizada (README, Swagger/OpenAPI).
- [ ] Arquivo na pasta docs/ para a funcionalidade implementada criado ou atualizado, versionando atualizações significativas.
- [ ] Mensagem de commit clara e descritiva, seguindo o padrão Conventional Commits.
