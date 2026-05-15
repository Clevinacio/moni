# RF05 - Faturas e Vencimentos (Implementação Concluída)

## Resumo
A implementação da **RF05: Faturas e Vencimentos** foi concluída com sucesso utilizando o fluxo TDD (Red-Green-Refactor).
A funcionalidade abrange a criação de faturas, marcação de status "Pago" (que automaticamente gera uma transação de despesa), e alertas de vencimento diários.

## Backend
- **Entidade `Fatura`**: Representa uma conta a pagar, contendo descrição, valor, data de vencimento, status `paga` e relacionamento com `Usuario`.
- **Database**: Arquivo liquibase `007-criar-tabela-faturas.yaml` criado e adicionado ao log master.
- **Service `FaturaService`**: Implementa a regra de negócios para criação, baixa (geração de transação atrelada), e listagem ordenada por data de vencimento.
- **Notificações**: O Job diário `FaturaNotificacaoJob` roda às 8h da manhã e identifica faturas a vencer em 5 dias, no mesmo dia, ou atrasadas. Para cada fatura nestas condições, uma notificação in-app (via `NotificacaoService`) é gerada em tempo real para o usuário correspondente, sob o tipo `FATURA_VENCIMENTO`.
- **Testes (JUnit)**: Testes de Integração (`FaturaContratoApiTest`) criados para validar os fluxos. Teste Unitário criado para o Job.

## Frontend (Angular 18)
- **Modelos**: Interfaces de DTO e Contrato criadas em `fatura.models.ts`.
- **State Management (Signals)**: Arquivo `faturas-store.ts` criado utilizando os Signals nativos. Ele gerencia a lista, estados de loading, mensagens de erro, e cálculos comutados para Resumo (Total Pendente, etc).
- **Service**: `ServicoFaturas` lida com as chamadas de API (`POST /bills`, `PATCH /bills/{id}/pay`, `GET /bills`).
  - No frontend Docker, as chamadas usam `environment.apiUrl` absoluto para alcançar o backend em `http://localhost:8080/api/v1` e permitir que o interceptor de autenticação aplique o JWT.
- **Componente de UI (`PaginaFaturas`)**:
  - Exibe cadastro validado em modal, acionado por botão desktop e FAB mobile, seguindo o padrão visual das telas de Metas e Transações.
  - Lista faturas em cards no mobile e tabela no desktop com tokens `brand-*`, `bg-surface`, estados responsivos e área mínima de toque de 44px.
  - Alerta visual no ícone para contas atrasadas.
  - Indicador de sucesso ou erro (WCAG 2.1 AA via Aria Lives).
- **Dashboard (`PaginaPainel`)**: O bloco "Próximas Contas" consome faturas reais da API, exibe apenas faturas não pagas ordenadas por vencimento e calcula o total pendente a partir desses dados.
- **Testes (Vitest)**: Todos os testes passados (`servicoFaturasContrato.spec.ts`, `faturas-store.spec.ts` e `paginaFaturasContrato.spec.ts`), garantindo total cobertura do fluxo Red-Green-Refactor em TypeScript.

## API Endpoints (`/api/v1/bills`)
- `POST /`: Cadastro de nova Fatura.
- `GET /`: Listagem de faturas do usuário autenticado.
- `PATCH /{id}/pay`: Baixa da fatura correspondente.
