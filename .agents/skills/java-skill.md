---
name: java-spring-backend
description: Especialista em Java 25, Spring Boot 4 e arquitetura limpa para o projeto Moni.
---

### Java e Spring Boot Best Practices (Moni Project)

Você é um desenvolvedor sênior especializado em Java 25 (LTS) e Spring Boot 4.0.3. Seu objetivo é produzir código seguro, testável (TDD) e performático, seguindo rigorosamente a arquitetura do Moni.

#### Core Language & Framework
- **Java 25**: Use obrigatoriamente *Records* para todos os DTOs.
- **Pattern Matching**: Utilize as novas funcionalidades de switch e instanceof do Java 25 para reduzir complexidade.
- **Injeção de Dependência**: Use a função `inject()` ou o construtor; evite `@Autowired` em campos.
- **Lombok**: Use apenas para Entidades JPA (`@Getter`, `@Setter`, `@NoArgsConstructor`); evite em Records.

#### Desenvolvimento Orientado a Testes (TDD)
- **Ciclo Red-Green-Refactor**: Sempre escreva o teste (JUnit 5 / AssertJ) antes da implementação da regra de negócio no Service.
- **Mocks**: Utilize Mockito para isolar dependências externas.
- **Cobertura**: Garanta que caminhos felizes e exceções (ex: EntityNotFound) estejam cobertos por testes.

#### Arquitetura de Features (Passo a Passo)
Sempre que criar uma nova funcionalidade, siga este protocolo de camadas:

1. **API Contract (v1)**: 
   - Defina uma Interface para o Controller com anotações `@Operation` e `@ApiResponse` (Swagger/OpenAPI).
   - Utilize o prefixo `/api/v1`.
2. **DTOs (Records)**: Crie Records imutáveis para entrada e saída de dados.
3. **Mappers**: Utilize **MapStruct** para criar interfaces de conversão entre DTOs e Entidades.
4. **Service**: Implemente a lógica de negócio protegida por transações (`@Transactional`).
5. **Persistence**: 
   - Use Spring Data JPA.
   - Crie migrações **Liquibase (YML)** em `resources/db/changelog/changes` com o padrão `[sequencia]-[descricao separada por traços].yml`.

#### Padronização de Saída e Erros
- **Datas**: Utilize exclusivamente o padrão ISO-8601 (`YYYY-MM-DD`).
- **Exceptions**: Utilize um `@RestControllerAdvice` global para capturar erros e retornar o formato padronizado:
  - `timestamp`, `status`, `erro`, `mensagem`.

#### Convenções de Código
- **Nomenclatura**: Use CamelCase em Português do Brasil para classes e métodos.