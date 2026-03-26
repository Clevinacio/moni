# Frontend - Modo Escuro (2026-03-25)

## Escopo

Implementação de modo escuro no frontend Angular com:
- alternância manual por botão;
- persistência da preferência do usuário no navegador;
- fallback para `prefers-color-scheme` na primeira visita;
- aplicação do tema antes do bootstrap para evitar FOUC.

## Decisões Técnicas

- Estratégia Tailwind: `darkMode: 'class'` em `html`.
- Tokens de cor via variáveis CSS para permitir troca de tema sem reescrever classes utilitárias.
- Chave de persistência: `moni.ui.theme.dark`.
- Store de UI em Angular Signals:
  - `temaEscuroAtivo`;
  - `alternarTema()`;
  - `inicializarTema()`;
  - `sincronizarTemaComSistema()`.
- Ícones: Lucide Angular (`Moon` e `Sun`).

## Arquivos Alterados

- `frontend/tailwind.config.ts`
- `frontend/src/styles.css`
- `frontend/src/index.html`
- `frontend/src/app/app.ts`
- `frontend/src/app/app.html`
- `frontend/src/app/store/preferencia-ui/preferencia-ui-storage.ts`
- `frontend/src/app/store/preferencia-ui/preferencia-ui-store.ts`
- `frontend/src/app/store/preferencia-ui/preferencia-ui-store.spec.ts`
- `frontend/src/app/features/auth/auth.ts`
- `frontend/src/app/features/auth/auth.html`
- `frontend/src/app/shared/components/shell-autenticado/shell-autenticado.ts`
- `frontend/src/app/shared/components/shell-autenticado/shell-autenticado.html`
- `frontend/src/app/features/auth/pages/login/login.html`
- `frontend/src/app/features/auth/pages/cadastro/cadastro.html`
- `frontend/src/app/features/auth/pages/painel/painel.html`
- `frontend/src/app/features/transacoes/pages/transacoes/transacoes.html`
- `frontend/src/app/features/transacoes/ui/lista-transacoes/lista-transacoes.html`
- `frontend/src/app/features/transacoes/ui/filtros-transacoes/filtros-transacoes.html`
- `frontend/src/app/shared/components/input-formulario/input-formulario.html`
- `frontend/src/app/shared/components/campo-categoria-transacao/campo-categoria-transacao.html`
- `frontend/src/app/shared/components/botao-submit/botao-submit.html`

## Acessibilidade e UX

- Botões de alternância com área de toque mínima `size-11` (>= 44px).
- `aria-label` dinâmico:
  - "Ativar modo escuro"
  - "Ativar modo claro"
- Contraste ajustado em superfícies principais (`bg-surface`, `bg-background`) para leitura em tema escuro.

## Validação

- Testes frontend: `npm run test` (49/49 passando).
- Build frontend: `npm run build` (sucesso).

## Observações

- Persistência manual tem prioridade sobre mudanças do tema do sistema.
- O listener de `prefers-color-scheme` atua apenas quando o usuário ainda não escolheu manualmente.
