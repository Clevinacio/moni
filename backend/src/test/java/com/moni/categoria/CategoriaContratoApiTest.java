package com.moni.categoria;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
@Import(CategoriaContratoApiTest.ConfiguracaoSegurancaTeste.class)
class CategoriaContratoApiTest {

    private static final String caminhoCadastro = "/api/v1/auth/register";
    private static final String caminhoLogin = "/api/v1/auth/login";
    private static final String caminhoTransacoes = "/api/v1/transactions";
    private static final String caminhoCategorias = "/api/v1/categories";
    private static final TypeReference<Map<String, Object>> tipoMapaJson = new TypeReference<>() {
    };

    @Autowired
    private Environment ambiente;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient clienteHttp = HttpClient.newHttpClient();

    @Test
    @DisplayName("GET /api/v1/categories deve listar categorias do usuario autenticado")
    void deveListarCategoriasDoUsuarioAutenticado() throws Exception {
        String tokenA = registrarELogarRetornandoToken();
        String tokenB = registrarELogarRetornandoToken();

        criarTransacao(tokenA, "Salario", "RECEITA", "Renda", "2026-03-10", "3000.00");
        criarTransacao(tokenA, "Mercado", "DESPESA", "Alimentacao", "2026-03-11", "250.00");
        criarTransacao(tokenB, "Carro", "DESPESA", "Transporte", "2026-03-12", "100.00");

        HttpResponse<String> resposta = enviarGetAutenticado(caminhoCategorias, tokenA);

        assertEquals(200, resposta.statusCode());
        assertCabecalhoJson(resposta);

        var lista = objectMapper.readTree(resposta.body());
        assertTrue(lista.isArray());
        assertEquals(2, lista.size());

        for (var item : lista) {
            assertTrue(item.hasNonNull("id"));
            assertTrue(item.hasNonNull("nome"));
            assertEquals(2, item.size());
        }
    }

    @Test
    @DisplayName("GET /api/v1/categories deve retornar 403 sem autenticacao")
    void deveRetornar403SemAutenticacao() throws Exception {
        HttpResponse<String> resposta = enviarGetAutenticado(caminhoCategorias, null);
        assertEquals(403, resposta.statusCode());
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
                  "categoria": {
                    "nome": "%s"
                  }
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
        return String.valueOf(corpoLogin.get("token"));
    }

    private HttpResponse<String> enviarPostJson(String caminho, String payload) throws Exception {
        return enviarComCorpo("POST", caminho, payload, null);
    }

    private HttpResponse<String> enviarPostJsonAutenticado(String caminho, String payload, String token)
            throws Exception {
        return enviarComCorpo("POST", caminho, payload, token);
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

        if ("POST".equals(metodo)) {
            builder.POST(HttpRequest.BodyPublishers.ofString(payload));
        } else {
            throw new IllegalArgumentException("Metodo HTTP nao suportado: " + metodo);
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
