# Moni

Aplicação de gestão financeira pessoal.

## Funcionalidades atuais

- Cadastro e login de usuário com autenticação JWT.
- Gestão de transações (criar, listar, editar e remover).
- Filtros de transações por período, tipo e categoria.
- Gestão de metas financeiras (criar, listar, detalhar, editar e remover).
- Consulta de categorias para organização de lançamentos.
- Central de notificações com listagem e remoção de notificações.

## Como rodar o projeto

### Docker (stack completa)

Na raiz do projeto:

```bash
docker compose --profile test up --build
```

Serviços:

- Frontend: http://localhost
- Backend: http://localhost:8080

### Local (desenvolvimento)

1. Suba apenas o banco:

```bash
docker compose --profile local up -d moni-db
```

2. Inicie o backend:

```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```

3. Em outro terminal, inicie o frontend:

```bash
cd frontend
npm install
npm start
```

URLs locais:

- Frontend: http://localhost:4200
- Backend: http://localhost:8080

## Documentação da API

Com o backend em execução:

- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
