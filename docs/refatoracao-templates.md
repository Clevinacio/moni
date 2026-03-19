# Refatoração: Templates Externos (Auth & Shared)

## Contexto
Originalmente, os componentes de autenticação e os componentes compartilhados (Shared) utilizavam a propriedade `template` inline para definir sua estrutura. No entanto, para fins de legibilidade e separação de conceitos, esses templates foram extraídos para seus respectivos arquivos `.html`. 

## Componentes Refatorados
Os seguintes componentes agora fazem uso da propriedade `templateUrl`:
- `InputFormularioComponent` -> `input-formulario.html`
- `BotaoSubmitComponent` -> `botao-submit.html`
- `CabecalhoAuthComponent` -> `cabecalho-auth.html`
- `PaginaCadastro` -> `cadastro.html`
- `PaginaLogin` -> `login.html`

## Impacto nos Testes
A mudança para `templateUrl` exigiu a configuração dos stubs em `paginaLoginContrato.spec.ts` e `paginaCadastroContrato.spec.ts`. Como o projeto opta por usar um resolver dinâmico (`resolveComponentResources`), foi implementada a leitura de todos os novos arquivos HTML associados ao componente, lendo-os via módulo `fs/promises`.
Os testes foram preservados e as asserções não foram modificadas, mantendo a cobertura do TDD inalterada.

## Acessibilidade (WCAG 2.1 AA)
A conversão do formato inline para arquivos `.html` não alterou o output estrutural. As propriedades dinâmicas de acessibilidade, como `[attr.aria-invalid]`, `[attr.aria-describedby]`, uso de semântica moderna (como `<header>`, rôles) continuam aplicadas.
