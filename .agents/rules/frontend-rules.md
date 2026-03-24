---
trigger: glob
globs: moni/frontend/**
---

**TDD para o Angular**:

- **Testes de Lógica (Services + Signals)**: Foque em testar Signals e manipulação de dados antes de criar o componente.
- **Responsividade**: A aplicação DEVE ser mobile first, com layout responsivo e se adequando bem a telas menores
- **Localização**: A aplicação deve ser escrita em PT-BR, respeitando regras de escrita e acentuação.
- **Testes de Componente (UI + Acessibilidade)**: Valide requisitos WCAG 2.1 AA e interação do usuário.
- **Testes de Estado (Store)**: Teste reatividade e comportamento do estado usando Angular Signals, incluindo transição de estados e reatividade de componentes dependentes.
- **Comando para testes**: Use APENAS npm run test para testar o frontend. Não adicione flags, o script por si só já funciona.
- **Angular Style Guide (IMPORTANTE)**: Siga as melhores práticas recomendadas pelo [Angular Style Guide](https://angular.dev/style-guide), incluindo organização de arquivos, nomenclatura e estrutura de pastas.
- **Estrutura de Features**: Organize módulos em `features/` contendo `ui/`, `services/` e `routes.ts` (Standalone).
- **Componentes genéricos**: Sempre extraia componentes globais (botões, inputs acessíveis, etc) para novos componentes que devem residir em `shared/components/`.
- **Workflow de Testes**: Siga o ciclo Red-Green-Refactor rigorosamente antes de implementar a UI.
- **Nomenclatura**: Use CamelCase para arquivos e classes em Português do Brasil.
- **Criação de componentes**: Sempre use o Angular CLI para criar novos componentes. NUNCA Acople HTML nos arquivos TS
- Use **Tailwind CSS** para toda a estilização; evite CSS puro nos arquivos `.css` ou `.scss`.
- Use **Lucide-angular** para todos os ícones.
- Componentes de ação devem ter `min-h-[44px]` ou padding que garanta a hit area de **44px** para conformidade mobile.
