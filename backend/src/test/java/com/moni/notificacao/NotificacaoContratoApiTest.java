package com.moni.notificacao;

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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(NotificacaoContratoApiTest.ConfiguracaoSegurancaTeste.class)
class NotificacaoContratoApiTest {

    private static final String CAMINHO_CADASTRO = "/api/v1/auth/register";
    private static final String CAMINHO_LOGIN = "/api/v1/auth/login";
    private static final String CAMINHO_METAS = "/api/v1/goals";
    private static final String CAMINHO_TRANSACOES = "/api/v1/transactions";
    private static final String CAMINHO_NOTIFICACOES = "/api/v1/notifications";
    private static final TypeReference<Map<String, Object>> TIPO_MAPA_JSON = new TypeReference<>() {
    };

    @Autowired
    private Environment ambiente;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient clienteHttp = HttpClient.newHttpClient();

    @Test
    @DisplayName("GET /api/v1/notifications deve listar notificacoes do usuario autenticado")
    void deveListarNotificacoesDoUsuarioAutenticado() throws Exception {
        String tokenUsuarioA = registrarELogarRetornandoToken();
        String tokenUsuarioB = registrarELogarRetornandoToken();

        criarMetaEAtingir(tokenUsuarioA, "Meta A");
        criarMetaEAtingir(tokenUsuarioB, "Meta B");

        HttpResponse<String> resposta = enviarGetAutenticado(CAMINHO_NOTIFICACOES, tokenUsuarioA);

        assertEquals(200, resposta.statusCode());
        assertCabecalhoJson(resposta);

        var lista = objectMapper.readTree(resposta.body());
        assertTrue(lista.isArray());
        assertTrue(lista.size() >= 1);

        var primeira = lista.get(0);
        assertNotNull(primeira.get("id"));
        assertNotNull(primeira.get("mensagem"));
        assertNotNull(primeira.get("tipo"));
        assertNotNull(primeira.get("lida"));
        assertNotNull(primeira.get("criadaEm"));
        assertEquals(5, primeira.size());
        assertTrue(primeira.get("mensagem").asText().contains("Meta A"));
        assertEquals("META_ATINGIDA", primeira.get("tipo").asText());
    }

    @Test
    @DisplayName("DELETE /api/v1/notifications deve limpar todas as notificacoes do usuario")
    void deveLimparNotificacoesDoUsuarioAutenticado() throws Exception {
        String token = registrarELogarRetornandoToken();

        criarMetaEAtingir(token, "Viagem");

        HttpResponse<String> respostaListagemAntes = enviarGetAutenticado(CAMINHO_NOTIFICACOES, token);
        assertEquals(200, respostaListagemAntes.statusCode());
        assertTrue(objectMapper.readTree(respostaListagemAntes.body()).size() >= 1);

        HttpResponse<String> respostaLimpeza = enviarDeleteAutenticado(CAMINHO_NOTIFICACOES, token);
        assertEquals(204, respostaLimpeza.statusCode());
        assertTrue(respostaLimpeza.body() == null || respostaLimpeza.body().isBlank());

        HttpResponse<String> respostaListagemDepois = enviarGetAutenticado(CAMINHO_NOTIFICACOES, token);
        assertEquals(200, respostaListagemDepois.statusCode());
        assertEquals(0, objectMapper.readTree(respostaListagemDepois.body()).size());
    }

    private void criarMetaEAtingir(String token, String nomeMeta) throws Exception {
        String payloadMeta = """
                {
                  "nome": "%s",
                  "valorAlvo": 100.00
                }
                """.formatted(nomeMeta);

        HttpResponse<String> respostaMeta = enviarComCorpo("POST", CAMINHO_METAS, payloadMeta, token);
        assertEquals(201, respostaMeta.statusCode());

        String metaId = String.valueOf(lerJsonComoMapa(respostaMeta.body()).get("id"));

        String payloadTransacao = """
                {
                  "descricao": "Aporte %s",
                  "valor": 100.00,
                  "data": "2026-03-26",
                  "tipo": "RECEITA",
                  "categoria": {
                    "nome": "Trabalho"
                  },
                  "metaId": "%s"
                }
                """.formatted(nomeMeta, metaId);

        HttpResponse<String> respostaTransacao = enviarComCorpo("POST", CAMINHO_TRANSACOES, payloadTransacao, token);
        assertEquals(201, respostaTransacao.statusCode());
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

        HttpResponse<String> respostaCadastro = enviarComCorpo("POST", CAMINHO_CADASTRO, payloadCadastro, null);
        assertEquals(201, respostaCadastro.statusCode());

        String payloadLogin = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(email, senha);

        HttpResponse<String> respostaLogin = enviarComCorpo("POST", CAMINHO_LOGIN, payloadLogin, null);
        assertEquals(200, respostaLogin.statusCode());

        Map<String, Object> corpoLogin = lerJsonComoMapa(respostaLogin.body());
        Object token = corpoLogin.get("token");
        assertTrue(token instanceof String && !((String) token).isBlank());

        return (String) token;
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

    private HttpResponse<String> enviarDeleteAutenticado(String caminho, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + obterPortaLocal() + caminho))
                .DELETE();

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
        assertTrue(contentType.toLowerCase().contains("application/json"));
    }

    private int obterPortaLocal() {
        String porta = ambiente.getProperty("local.server.port");
        if (porta == null || porta.isBlank()) {
            throw new IllegalStateException("Nao foi possivel obter a porta local da aplicacao de teste.");
        }

        return Integer.parseInt(porta);
    }

    private Map<String, Object> lerJsonComoMapa(String conteudoJson) throws Exception {
        return objectMapper.readValue(conteudoJson, TIPO_MAPA_JSON);
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