# RF07 - Central de Notificacoes In-App (2026-03-26)

## Escopo implementado nesta entrega
- Central de notificacoes integrada ao icone de sino no menu autenticado (desktop e mobile).
- Consumo de notificacoes de metas atingidas ja persistidas no backend.
- Badge com total de notificacoes nao lidas no icone de notificacoes.
- Atualizacao do badge em tempo real via WebSocket STOMP quando uma nova notificacao e persistida.
- Fallback por polling no frontend para manter resiliencia em caso de indisponibilidade temporaria do socket.
- Persistencia das notificacoes: nao somem automaticamente; permanecem ate acao explicita de Limpar.
- Acao Limpar remove permanentemente todas as notificacoes do usuario autenticado.

## Regras de negocio aplicadas
- Listagem e limpeza sao sempre escopadas ao usuario autenticado (extraido do JWT via `Authentication.getName()`).
- A notificacao continua sendo gerada automaticamente quando uma meta e atingida (regra RF04 preservada).
- O frontend nao remove notificacoes localmente sem sincronizacao com backend na acao Limpar.
- Escopo atual da RF07: notificacoes de `META_ATINGIDA`.

## API adicionada
Base: `/api/v1/notifications`

- `GET /api/v1/notifications`
  - Retorna lista de notificacoes do usuario autenticado ordenadas por data de criacao decrescente.
- `DELETE /api/v1/notifications`
  - Remove todas as notificacoes do usuario autenticado.

## Canal em tempo real
- Endpoint WebSocket: `/ws/notificacoes`
- Protocolo: STOMP
- Header de autenticacao no CONNECT: `Authorization: Bearer <jwt>`
- Destino de consumo por usuario: `/user/queue/notificacoes`
- Publicacao backend: `convertAndSendToUser(<usuarioId>, "/queue/notificacoes", NotificacaoResponse)`

### Contrato de resposta da notificacao
```json
{
  "id": "uuid",
  "mensagem": "Parabéns! A meta \"Viagem\" foi atingida.",
  "tipo": "META_ATINGIDA",
  "lida": false,
  "criadaEm": "2026-03-26T11:20:00Z"
}
```

## Backend - componentes criados/alterados
### Criados
- DTO: `NotificacaoResponse`
- Endpoints: `NotificacaoEndpoints`
- Controller: `NotificacaoController`
- Testes:
  - `NotificacaoServiceTest`
  - `NotificacaoContratoApiTest`

### Alterados
- `NotificacaoRepository`
  - `findByUsuarioIdOrderByCriadaEmDesc(UUID usuarioId)`
  - `deleteByUsuarioId(UUID usuarioId)`
- `SecurityConfig`
  - rota publica para handshake: `/ws/notificacoes/**`
- `NotificacaoService`
  - `listar(Authentication autenticacao)`
  - `limpar(Authentication autenticacao)`
  - envio em tempo real para fila do usuario autenticado
  - validacao de autenticacao e extracao de `usuarioId`

### Criados
- `WebSocketConfig`
  - broker simples (`/topic`, `/queue`)
  - user destination prefix (`/user`)
  - autenticacao JWT no STOMP CONNECT via `Authorization`

## Frontend - componentes criados/alterados
### Criados
- Model: `notificacao.models.ts`
- Service: `ServicoNotificacoes`
- Store: `NotificacoesStore`
- Testes:
  - `servicoNotificacoesContrato.spec.ts`
  - `notificacoes-store.spec.ts`
  - `shell-autenticado.spec.ts`

### Alterados
- `shell-autenticado.ts`
  - carga inicial de notificacoes
  - conexao STOMP para receber notificacoes em tempo real
  - controle de abertura/fechamento do painel
  - acao Limpar com sincronizacao no backend
- `shell-autenticado.html`
  - painel de notificacoes
  - badge de nao lidas no sino
  - estados de carregamento, erro e vazio

## Acessibilidade e UX
- Botoes com foco visivel (`focus-visible:outline-*`).
- Uso de `aria-label`, `aria-expanded`, `aria-controls`, `role="dialog"`, `aria-modal`.
- Mensagens de status e erro com `aria-live`.
- Area de toque minima respeitada (`min-h-11`/`size-11`) para interacao mobile.

## Validacao executada
### Backend
Comando:
- `cd backend && ./gradlew test`

Resultado:
- Build SUCCESS
- Testes totais: 63
- Falhas: 0

### Frontend
Comandos:
- `cd frontend && npm run test`
- `cd frontend && npm run build`

Resultado:
- Testes: 58 passando
- Build de producao concluido com sucesso

## Notas tecnicas
- O build do frontend reporta warning de dependencia CommonJS para `@stomp/stompjs`.
- O warning nao bloqueia build/test e o fluxo de notificacao em tempo real permanece funcional.

## Observacoes de evolucao
- Nesta entrega nao foi implementado marcar notificacao individual como lida.
- Notificacoes de faturas vencendo/atrasadas permanecem como evolucao futura da RF07.
