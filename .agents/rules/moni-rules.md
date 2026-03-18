---
trigger: glob
globs: **
---

**Contexto**: O `userId` deve ser extraído do JWT; nunca enviado no corpo do JSON.

**Datas**: Padrão ISO-8601 (`YYYY-MM-DD`).

**Erros**: Respostas de erro devem incluir `timestamp`, `status`, `erro` e `mensagem`.

**TDD**: Escreva testes (JUnit 5 / Jasmine) SEMPRE antes de implementar a funcionalidade, seguindo a abordagem Test-Driven Development (TDD) para garantir código testável e de alta qualidade.

**Implementação Orientada a Testes**: Siga o ciclo Red-Green-Refactor rigorosamente, garantindo que cada teste falhe antes de escrever o código de produção e que o código seja refatorado para manter a qualidade. NÃO REESCREVA OS TESTES.

**Nomenclatura**: Siga as convenções de nomenclatura com CamelCase para classes, métodos, variáveis, testes e arquivos. Utilize nomes descritivos e consistentes em português do Brasil para melhorar a legibilidade do código.

**Comentários**: Evite comentários desnecessários; o código deve ser autoexplicativo. Use comentários apenas para explicar "porquês" complexos.

**Documentação**: Mantenha o README atualizado com instruções de setup, uso e contribuição.