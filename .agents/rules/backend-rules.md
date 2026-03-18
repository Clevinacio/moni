---
trigger: glob
globs: moni/backend/**
---

**Java 25**: Use obrigatoriamente Records para DTOs e Pattern Matching.

**Qualidade**: TDD (JUnit 5) é obrigatório antes de qualquer implementação.

**Endpoints**: Siga rigorosamente os contratos de API definidos, utilizando verbos HTTP corretos e retornando códigos de status apropriados. Concentre os contratos em interfaces com anotações de mapeamento e documentação, e mantenha os controllers como implementadores dessas interfaces para garantir clareza e organização.

**Segurança de Rotas**: Configure o Spring Security para proteger as rotas, garantindo que apenas usuários autenticados possam acessar os endpoints privados. Utilize JWT para autenticação stateless e valide o `Owner ID` em todas as requisições para garantir que os usuários só possam acessar seus próprios dados. Nas rotas públicas (como autenticação), certifique-se de que estejam corretamente configuradas para permitir acesso sem autenticação. Jamais aceite `userId` no corpo da requisição. Use o contexto do JWT.

**Data/Hora**: Use ISO-8601 e PostgreSQL para persistência.