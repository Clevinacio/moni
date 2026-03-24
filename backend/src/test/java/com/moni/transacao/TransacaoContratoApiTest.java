package com.moni.transacao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.moni.configuration.JwtAuthenticationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.context.TestConfiguration;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(TransacaoContratoApiTest.ConfiguracaoSegurancaTeste.class)
class TransacaoContratoApiTest {

    private static final String caminhoCadastro = "/api/v1/auth/register";
    private static final String caminhoLogin = "/api/v1/auth/login";
    private static final String caminhoTransacoes = "/api/v1/transactions";
    private static final TypeReference<Map<String, Object>> tipoMapaJson = new TypeReference<>() {
    };

    @Autowired
    private Environment ambiente;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient clienteHttp = HttpClient.newHttpClient();

    @Test
    @DisplayName("POST /api/v1/transactions deve retornar 201 e contrato estrito de sucesso")
    void deveCriarTransacaoComSucessoQuandoPayloadValido() throws Exception {
        String token = registrarELogarRetornandoToken();

        String payload = """
                {
                  "descricao": "Salario",
                  "valor": 4500.00,
                  "data": "2026-03-20",
                  "tipo": "RECEITA",
                  "categoria": "Trabalho"
                }
                """;

        HttpResponse<String> resposta = enviarPostJsonAutenticado(caminhoTransacoes, payload, token);

        assertEquals(201, resposta.statusCode());
        assertCabecalhoJson(resposta);

        Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
        assertEquals(6, corpo.size());
        assertCampoTextoNaoVazio(corpo, "id");
        assertCampoTextoNaoVazio(corpo, "descricao");
        assertCampoPresenteENaoNulo(corpo, "valor");
        assertCampoTextoNaoVazio(corpo, "data");
        assertCampoTextoNaoVazio(corpo, "tipo");
        assertCampoTextoNaoVazio(corpo, "categoria");
    }

    @Test
    @DisplayName("POST /api/v1/transactions deve validar campos obrigatorios")
    void deveRejeitarCriacaoQuandoCamposObrigatoriosAusentes() throws Exception {
        String token = registrarELogarRetornandoToken();

        String payload = """
                {
                  "descricao": "Mercado",
                  "valor": 150.50,
                  "tipo": "DESPESA",
                  "categoria": "Alimentacao"
                }
                """;

        HttpResponse<String> resposta = enviarPostJsonAutenticado(caminhoTransacoes, payload, token);

        assertContratoErroPadrao(resposta, 400);
    }

    @Test
    @DisplayName("GET /api/v1/transactions deve listar apenas transacoes do usuario autenticado")
    void deveListarSomenteTransacoesDoProprioUsuario() throws Exception {
        String tokenUsuarioA = registrarELogarRetornandoToken();
        String tokenUsuarioB = registrarELogarRetornandoToken();

        criarTransacao(tokenUsuarioA, "Receita A", "RECEITA", "Categoria A", "2026-03-01", "1200.00");
        criarTransacao(tokenUsuarioB, "Receita B", "RECEITA", "Categoria B", "2026-03-02", "1300.00");

        HttpResponse<String> resposta = enviarGetAutenticado(caminhoTransacoes, tokenUsuarioA);
        assertEquals(200, resposta.statusCode());
        assertCabecalhoJson(resposta);

        var lista = objectMapper.readTree(resposta.body());
        assertTrue(lista.isArray(), "A resposta deve ser uma lista JSON.");
        assertTrue(lista.size() >= 1, "A lista deve conter ao menos uma transacao do usuario autenticado.");

        for (var item : lista) {
            assertEquals("Receita A", item.get("descricao").asText());
        }
    }

    @Test
    @DisplayName("GET /api/v1/transactions deve filtrar por mes e ano")
    void deveFiltrarTransacoesPorMesEAno() throws Exception {
        String token = registrarELogarRetornandoToken();

        criarTransacao(token, "Receita Marco", "RECEITA", "Trabalho", "2026-03-10", "1000.00");
        criarTransacao(token, "Receita Abril", "RECEITA", "Trabalho", "2026-04-10", "1000.00");

        HttpResponse<String> resposta = enviarGetAutenticado(caminhoTransacoes + "?mes=3&ano=2026", token);
        assertEquals(200, resposta.statusCode());
        assertCabecalhoJson(resposta);

        var lista = objectMapper.readTree(resposta.body());
        assertTrue(lista.isArray(), "A resposta deve ser uma lista JSON.");
        assertTrue(lista.size() >= 1, "A lista filtrada deve conter transacoes de marco.");
        for (var item : lista) {
            assertTrue(item.get("data").asText().startsWith("2026-03"), "A data deve pertencer a marco de 2026.");
        }
    }

    @Test
    @DisplayName("PUT /api/v1/transactions/{id} deve atualizar transacao do proprio usuario")
    void deveAtualizarTransacaoDoProprioUsuario() throws Exception {
        String token = registrarELogarRetornandoToken();
        String id = criarTransacao(token, "Internet", "DESPESA", "Casa", "2026-03-15", "120.00");

        String payloadAtualizacao = """
                {
                  "descricao": "Internet Fibra",
                  "valor": 130.00,
                  "data": "2026-03-16",
                  "tipo": "DESPESA",
                  "categoria": "Casa"
                }
                """;

        HttpResponse<String> resposta = enviarPutJsonAutenticado(caminhoTransacoes + "/" + id, payloadAtualizacao,
                token);
        assertEquals(200, resposta.statusCode());
        assertCabecalhoJson(resposta);

        Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
        assertEquals("Internet Fibra", corpo.get("descricao"));
    }

    @Test
    @DisplayName("PUT /api/v1/transactions/{id} deve retornar 403 ao atualizar transacao de outro usuario")
    void deveRetornar403AoAtualizarTransacaoDeOutroUsuario() throws Exception {
        String tokenUsuarioA = registrarELogarRetornandoToken();
        String tokenUsuarioB = registrarELogarRetornandoToken();
        String id = criarTransacao(tokenUsuarioA, "Parcela", "DESPESA", "Cartao", "2026-03-15", "250.00");

        String payloadAtualizacao = """
                {
                  "descricao": "Parcela Atualizada",
                  "valor": 250.00,
                  "data": "2026-03-15",
                  "tipo": "DESPESA",
                  "categoria": "Cartao"
                }
                """;

        HttpResponse<String> resposta = enviarPutJsonAutenticado(caminhoTransacoes + "/" + id, payloadAtualizacao,
                tokenUsuarioB);
        assertContratoErroPadrao(resposta, 403);
    }

    @Test
    @DisplayName("DELETE /api/v1/transactions/{id} deve retornar 204 e depois 404")
    void deveExcluirTransacaoERejeitarExclusaoRepetida() throws Exception {
        String token = registrarELogarRetornandoToken();
        String id = criarTransacao(token, "Assinatura", "DESPESA", "Servicos", "2026-03-05", "40.00");

        HttpResponse<String> respostaExclusao = enviarDeleteAutenticado(caminhoTransacoes + "/" + id, token);
        assertEquals(204, respostaExclusao.statusCode());
        assertTrue(respostaExclusao.body() == null || respostaExclusao.body().isBlank(),
                "DELETE 204 nao deve retornar corpo.");

        HttpResponse<String> segundaExclusao = enviarDeleteAutenticado(caminhoTransacoes + "/" + id, token);
        assertContratoErroPadrao(segundaExclusao, 404);
    }

    private String criarTransacao(String token, String descricao, String tipo, String categoria, String data,
            String valor)
            throws Exception {
        String payload = """
                {
                  "descricao": "%s",
                  "valor": %s,
                  "data": "%s",
                  "tipo": "%s",
                  "categoria": "%s"
                }
                """.formatted(descricao, valor, data, tipo, categoria);

        HttpResponse<String> resposta = enviarPostJsonAutenticado(caminhoTransacoes, payload, token);
        assertEquals(201, resposta.statusCode());

        Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
        return String.valueOf(corpo.get("id"));
    }

    private String registrarELogarRetornandoToken() throws Exception {
        String email = "usuario+" + UUID.randomUUID().toString().replace("-", "") + "@moni.com";
        String senha = "Senha123";

        String payloadCadastro = """
                {
                  "name": "Usuario Teste",
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, senha);

        HttpResponse<String> respostaCadastro = enviarPostJson(caminhoCadastro, payloadCadastro);
        assertEquals(201, respostaCadastro.statusCode());

        String payloadLogin = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, senha);

        HttpResponse<String> respostaLogin = enviarPostJson(caminhoLogin, payloadLogin);
        assertEquals(200, respostaLogin.statusCode());

        Map<String, Object> corpoLogin = lerJsonComoMapa(respostaLogin.body());
        Object token = corpoLogin.get("token");
        assertTrue(token instanceof String && !((String) token).isBlank(), "Token JWT deve estar presente no login.");

        return (String) token;
    }

    private HttpResponse<String> enviarPostJson(String caminho, String payload) throws Exception {
        return enviarComCorpo("POST", caminho, payload, null);
    }

    private HttpResponse<String> enviarPostJsonAutenticado(String caminho, String payload, String token)
            throws Exception {
        return enviarComCorpo("POST", caminho, payload, token);
    }

    private HttpResponse<String> enviarPutJsonAutenticado(String caminho, String payload, String token)
            throws Exception {
        return enviarComCorpo("PUT", caminho, payload, token);
    }

    private HttpResponse<String> enviarDeleteAutenticado(String caminho, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + obterPortaLocal() + caminho))
                .DELETE();

        if (token != null && !token.isBlank()) {
            builder.header("Authorization", "Bearer " + token);
        }

        return clienteHttp.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> enviarGetAutenticado(String caminho, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + obterPortaLocal() + caminho))
                .GET();

        if (token != null && !token.isBlank()) {
            builder.header("Authorization", "Bearer " + token);
        }

        return clienteHttp.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> enviarComCorpo(String metodo, String caminho, String payload, String token)
            throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + obterPortaLocal() + caminho))
                .header("Content-Type", "application/json");

        if (token != null && !token.isBlank()) {
            builder.header("Authorization", "Bearer " + token);
        }

        switch (metodo) {
            case "POST" -> builder.POST(HttpRequest.BodyPublishers.ofString(payload));
            case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofString(payload));
            default -> throw new IllegalArgumentException("Metodo HTTP nao suportado: " + metodo);
        }

        return clienteHttp.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    private void assertCabecalhoJson(HttpResponse<String> resposta) {
        String contentType = resposta.headers().firstValue("content-type").orElse("");
        assertTrue(contentType.toLowerCase().contains("application/json"),
                "A resposta deve conter content-type JSON.");
    }

    private void assertCampoTextoNaoVazio(Map<String, Object> corpo, String campo) {
        Object valor = corpo.get(campo);
        assertTrue(valor instanceof String && !((String) valor).isBlank(),
                "O campo " + campo + " deve estar presente e preenchido.");
    }

    private void assertCampoPresenteENaoNulo(Map<String, Object> corpo, String campo) {
        assertTrue(corpo.containsKey(campo), "O campo " + campo + " deve existir no corpo.");
        assertNotNull(corpo.get(campo), "O campo " + campo + " nao pode ser nulo.");
    }

    private void assertContratoErroPadrao(HttpResponse<String> resposta, int statusEsperado) throws Exception {
        assertEquals(statusEsperado, resposta.statusCode());
        assertCabecalhoJson(resposta);

        Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
        assertCampoTextoNaoVazio(corpo, "timestamp");
        assertCampoPresenteENaoNulo(corpo, "status");
        assertEquals(statusEsperado, ((Number) corpo.get("status")).intValue());
        assertCampoTextoNaoVazio(corpo, "erro");
        assertCampoTextoNaoVazio(corpo, "mensagem");
    }

    private int obterPortaLocal() {
        String porta = ambiente.getProperty("local.server.port");
        if (porta == null || porta.isBlank()) {
            throw new IllegalStateException("Nao foi possivel obter a porta local da aplicacao de teste.");
        }

        return Integer.parseInt(porta);
    }

    private Map<String, Object> lerJsonComoMapa(String conteudoJson) throws Exception {
        return objectMapper.readValue(conteudoJson, tipoMapaJson);
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class ConfiguracaoSegurancaTeste {

        @Bean
        SecurityFilterChain cadeiaSeguranca(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
                throws Exception {
            return http
                    .csrf(AbstractHttpConfigurer::disable)
                    .httpBasic(AbstractHttpConfigurer::disable)
                    .formLogin(AbstractHttpConfigurer::disable)
                    .sessionManagement((sessao) -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                    .authorizeHttpRequests((autorizacao) -> autorizacao
                            .requestMatchers("/api/v1/auth/**").permitAll()
                            .anyRequest().authenticated())
                    .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                    .build();
        }
    }
}
