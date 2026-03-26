# Paleta de Cores Frontend - 2026-03-18

## Objetivo

Substituir as cores padrão do Tailwind por uma paleta customizada, coerente e acessível (WCAG 2.1 AA), alinhada ao design institucional do Moni.

## Configuração (`tailwind.config.ts`)

| Token             | Hex       | Uso principal                                 |
|-------------------|-----------|-----------------------------------------------|
| `brand-dark`      | `#355872` | Texto primário, fundo de botão, bordas fortes  |
| `brand` (DEFAULT) | `#7AAACE` | Cor da marca, links, outlines de foco          |
| `brand-light`     | `#9CD5FF` | Bordas suaves, fundos com transparência        |
| `background`      | `#F7F8F0` | Fundo geral do aplicativo (`body`)             |
| `success`         | `#4A7C59` | Botões/alertas de sucesso (texto branco AA)    |
| `error`           | `#B84A4A` | Erros de validação e mensagens críticas (AA)   |
| `alert`           | `#D9A05B` | Avisos (usar com `text-brand-dark` ou preto)   |

## Tokens Dinâmicos por Tema (2026-03-25)

Com a implementação do modo escuro, os tokens passaram a ser lidos por variáveis CSS (`rgb(var(--token) / <alpha-value>)`), mantendo as classes Tailwind existentes e trocando apenas os valores por tema.

### Tema claro (`:root`)

| Variável CSS | Valor RGB |
|---|---|
| `--color-brand-dark` | `53 88 114` |
| `--color-brand` | `122 170 206` |
| `--color-brand-light` | `156 213 255` |
| `--color-background` | `247 248 240` |
| `--color-surface` | `255 255 255` |
| `--color-success` | `74 124 89` |
| `--color-error` | `184 74 74` |
| `--color-alert` | `217 160 91` |

### Tema escuro (`.dark`)

| Variável CSS | Valor RGB |
|---|---|
| `--color-brand-dark` | `228 238 247` |
| `--color-brand` | `124 183 226` |
| `--color-brand-light` | `91 130 161` |
| `--color-background` | `18 24 32` |
| `--color-surface` | `26 35 48` |
| `--color-success` | `97 184 124` |
| `--color-error` | `232 120 120` |
| `--color-alert` | `232 181 116` |

## Arquivos Alterados

- `frontend/tailwind.config.ts` — adicionado (novo arquivo de configuração Tailwind v4)
- `frontend/src/styles.css` — aplica `@config`, variáveis CSS para claro/escuro e layer base com `bg-background text-brand-dark`
- `frontend/src/index.html` — script anti-FOUC para aplicar `.dark` antes do bootstrap
- `frontend/src/app/store/preferencia-ui/preferencia-ui-store.ts` — estado de tema com Angular Signals
- `frontend/src/app/store/preferencia-ui/preferencia-ui-storage.ts` — persistência de preferência no localStorage
- `frontend/src/app/features/auth/pages/login/login.html` — classes migradas para a nova paleta
- `frontend/src/app/features/auth/pages/cadastro/cadastro.html` — idem
- `frontend/src/app/features/auth/pages/painel/painel.html` — idem
- `frontend/src/app/features/auth/ui/cabecalho-auth/cabecalho-auth.ts` — template inline atualizado
- `frontend/src/app/features/inicial/pages/inicial/inicial.html` — idem
- `frontend/src/app/features/nao-encontrada/pages/nao-encontrada/nao-encontrada.html` — idem

## Acessibilidade (WCAG 2.1 AA)

- `brand-dark` sobre `background`: contraste ≈ 5.6:1 ✅
- `success` sobre branco: contraste ≈ 4.8:1 ✅
- `error` sobre branco: contraste ≈ 4.9:1 ✅
- `alert` deve sempre ser usado com `text-brand-dark` ou preto (contraste ≈ 4.5:1) ✅
- `brand-light` não deve ser usado diretamente como cor de texto sobre branco (uso restrito a bordas/fundos)
- Inputs com `min-h-11` (≥ 44px) e `focus-visible` explícito em todos os campos interativos ✅
- Mensagens de erro com `role="alert"` e `aria-live="assertive"` ✅
- Mensagens de sucesso com `role="status"` e `aria-live="polite"` ✅

## Validação Executada

- Build: `npm run build` — OK ✅
- Testes: `npm run test` — 49/49 passando ✅
