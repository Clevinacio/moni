package com.moni.meta;

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
@Import(MetaContratoApiTest.ConfiguracaoSegurancaTeste.class)
class MetaContratoApiTest {

    private static final String CAMINHO_CADASTRO = "/api/v1/auth/register";
    private static final String CAMINHO_LOGIN = "/api/v1/auth/login";
    private static final String CAMINHO_METAS = "/api/v1/goals";
    private static final TypeReference<Map<String, Object>> TIPO_MAPA_JSON = new TypeReference<>() {
    };

    @Autowired
    private Environment ambiente;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient clienteHttp = HttpClient.newHttpClient();

    @Test
    @DisplayName("POST /api/v1/goals deve retornar 201 e contrato estrito")
    void deveCriarMetaComSucesso() throws Exception {
        String token = registrarELogarRetornandoToken();

        String payload = """
                {
                  "nome": "Viagem 2026",
                  "valorAlvo": 15000.00
                }
                """;

        HttpResponse<String> resposta = enviarComCorpo("POST", CAMINHO_METAS, payload, token);

        assertEquals(201, resposta.statusCode());
        assertCabecalhoJson(resposta);

        Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
        assertEquals(4, corpo.size());
        assertCampoTextoNaoVazio(corpo, "id");
        assertEquals("Viagem 2026", corpo.get("nome"));
        assertCampoPresenteENaoNulo(corpo, "valorAlvo");
        assertCampoPresenteENaoNulo(corpo, "valorPoupado");
    }

    @Test
    @DisplayName("GET /api/v1/goals deve listar metas do usuario autenticado")
    void deveListarMetasDoUsuarioAutenticado() throws Exception {
        String tokenUsuarioA = registrarELogarRetornandoToken();
        String tokenUsuarioB = registrarELogarRetornandoToken();

        criarMeta(tokenUsuarioA, "Meta A", "1000.00");
        criarMeta(tokenUsuarioB, "Meta B", "2000.00");

        HttpResponse<String> resposta = enviarGetAutenticado(CAMINHO_METAS, tokenUsuarioA);
        assertEquals(200, resposta.statusCode());
        assertCabecalhoJson(resposta);

        var lista = objectMapper.readTree(resposta.body());
        assertTrue(lista.isArray());
        assertTrue(lista.size() >= 1);
        assertEquals("Meta A", lista.get(0).get("nome").asText());
    }

    private String criarMeta(String token, String nome, String valorAlvo) throws Exception {
        String payload = """
                {
                  "nome": "%s",
                  "valorAlvo": %s
                }
                """.formatted(nome, valorAlvo);

        HttpResponse<String> resposta = enviarComCorpo("POST", CAMINHO_METAS, payload, token);
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

    private void assertCampoTextoNaoVazio(Map<String, Object> corpo, String campo) {
        Object valor = corpo.get(campo);
        assertTrue(valor instanceof String && !((String) valor).isBlank());
    }

    private void assertCampoPresenteENaoNulo(Map<String, Object> corpo, String campo) {
        assertTrue(corpo.containsKey(campo));
        assertNotNull(corpo.get(campo));
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
