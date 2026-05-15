package com.moni.fatura;

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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.moni.configuration.JwtAuthenticationFilter;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(FaturaContratoApiTest.ConfiguracaoSegurancaTeste.class)
class FaturaContratoApiTest {

    private static final String caminhoCadastro = "/api/v1/auth/register";
    private static final String caminhoLogin = "/api/v1/auth/login";
    private static final String caminhoFaturas = "/api/v1/bills";
    private static final TypeReference<Map<String, Object>> tipoMapaJson = new TypeReference<>() {};

    @Autowired
    private Environment ambiente;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient clienteHttp = HttpClient.newHttpClient();

    @Test
    @DisplayName("POST /api/v1/bills deve retornar 201 e contrato estrito de sucesso")
    void deveCriarFaturaComSucessoQuandoPayloadValido() throws Exception {
        String token = registrarELogarRetornandoToken();

        String payload = """
                {
                  "descricao": "Conta de Luz",
                  "valor": 120.50,
                  "dataVencimento": "2026-05-10"
                }
                """;

        HttpResponse<String> resposta = enviarPostJsonAutenticado(caminhoFaturas, payload, token);

        if (resposta.statusCode() != 201) {
            System.out.println("ERRO NA CRIACAO: " + resposta.body());
        }

        assertEquals(201, resposta.statusCode());

        Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
        assertTrue(corpo.containsKey("id"));
        assertEquals("Conta de Luz", corpo.get("descricao"));
        assertEquals(120.5, corpo.get("valor"));
        assertEquals("2026-05-10", corpo.get("dataVencimento"));
        assertEquals(false, corpo.get("paga"));
    }

    @Test
    @DisplayName("PATCH /api/v1/bills/{id}/pay deve marcar como paga e retornar 200")
    void devePagarFaturaComSucesso() throws Exception {
        String token = registrarELogarRetornandoToken();

        String payloadCriar = """
                {
                  "descricao": "Conta de Agua",
                  "valor": 80.00,
                  "dataVencimento": "2026-05-12"
                }
                """;
        HttpResponse<String> respostaCriar = enviarPostJsonAutenticado(caminhoFaturas, payloadCriar, token);
        assertEquals(201, respostaCriar.statusCode());
        
        Map<String, Object> faturaCriada = lerJsonComoMapa(respostaCriar.body());
        String idFatura = (String) faturaCriada.get("id");

        HttpResponse<String> respostaPagar = enviarPatchJsonAutenticado(caminhoFaturas + "/" + idFatura + "/pay", "{}", token);
        assertEquals(200, respostaPagar.statusCode());

        Map<String, Object> faturaPaga = lerJsonComoMapa(respostaPagar.body());
        assertEquals(true, faturaPaga.get("paga"));
    }

    // --- Métodos Auxiliares ---
    
    private String registrarELogarRetornandoToken() throws Exception {
        String email = "teste.fatura." + UUID.randomUUID() + "@exemplo.com";
        String payloadRegistro = String.format("""
                {
                  "name": "Usuario Teste",
                  "email": "%s",
                  "password": "SenhaForte123!"
                }
                """, email);
        enviarPostJson(caminhoCadastro, payloadRegistro);

        String payloadLogin = String.format("""
                {
                  "email": "%s",
                  "password": "SenhaForte123!"
                }
                """, email);
        HttpResponse<String> respostaLogin = enviarPostJson(caminhoLogin, payloadLogin);
        Map<String, Object> corpoLogin = lerJsonComoMapa(respostaLogin.body());
        return (String) corpoLogin.get("token");
    }

    private HttpResponse<String> enviarPostJson(String caminho, String payloadJson) throws Exception {
        HttpRequest requisicao = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + ambiente.getProperty("local.server.port") + caminho))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
                .build();
        return clienteHttp.send(requisicao, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> enviarPostJsonAutenticado(String caminho, String payloadJson, String token) throws Exception {
        HttpRequest requisicao = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + ambiente.getProperty("local.server.port") + caminho))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(payloadJson))
                .build();
        return clienteHttp.send(requisicao, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> enviarPatchJsonAutenticado(String caminho, String payloadJson, String token) throws Exception {
        HttpRequest requisicao = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + ambiente.getProperty("local.server.port") + caminho))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .method("PATCH", HttpRequest.BodyPublishers.ofString(payloadJson))
                .build();
        return clienteHttp.send(requisicao, HttpResponse.BodyHandlers.ofString());
    }

    private Map<String, Object> lerJsonComoMapa(String json) throws Exception {
        return objectMapper.readValue(json, tipoMapaJson);
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
                            .requestMatchers("/api/v1/auth/**", "/error").permitAll()
                            .anyRequest().authenticated())
                    .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                    .build();
        }
    }
}
