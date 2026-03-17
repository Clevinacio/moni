package com.moni.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(AutenticacaoContratoApiTddVermelhoTest.ConfiguracaoSegurancaTeste.class)
class AutenticacaoContratoApiTddVermelhoTest {

	private static final String caminhoCadastro = "/api/v1/auth/register";
	private static final String caminhoLogin = "/api/v1/auth/login";
	private static final Pattern padraoJwt = Pattern.compile("^[^.]+\\.[^.]+\\.[^.]+$");
	private static final TypeReference<Map<String, Object>> tipoMapaJson = new TypeReference<>() {
	};

	@Autowired
	private Environment ambiente;

	private final ObjectMapper objectMapper = new ObjectMapper();

	private final HttpClient clienteHttp = HttpClient.newHttpClient();

	@Test
	@DisplayName("POST /api/v1/auth/register deve retornar 201 e contrato estrito de sucesso")
	void deveRegistrarUsuarioComSucessoQuandoPayloadValido() throws Exception {
		assertContratoSucessoCadastro(cadastrarUsuario("Maria", novoEmail(), "Senha123"));
	}

	@ParameterizedTest(name = "[{index}] {0}")
	@MethodSource("fornecerPayloadsCadastroComCamposAusentesNulosOuVazios")
	@DisplayName("POST /api/v1/auth/register deve validar campos obrigatorios ausentes, nulos e vazios")
	void deveRejeitarCadastroQuandoCamposObrigatoriosAusentesNulosOuVazios(String cenario, String payload)
			throws Exception {
		assertContratoErroPadrao(enviarPostJson(caminhoCadastro, payload), 400);
	}

	@Test
	@DisplayName("POST /api/v1/auth/register deve rejeitar e-mail com formato invalido")
	void deveRejeitarCadastroQuandoEmailInvalido() throws Exception {
		String payload = """
				{
				  "name": "Maria",
				  "email": "email-invalido",
				  "password": "Senha123"
				}
				""";

		assertContratoErroPadrao(enviarPostJson(caminhoCadastro, payload), 400);
	}

	@Test
	@DisplayName("POST /api/v1/auth/register deve rejeitar senha com menos de 8 caracteres")
	void deveRejeitarCadastroQuandoSenhaForMenorQueOito() throws Exception {
		String payload = """
				{
				  "name": "Maria",
				  "email": "maria+curta@moni.com",
				  "password": "1234567"
				}
				""";

		assertContratoErroPadrao(enviarPostJson(caminhoCadastro, payload), 400);
	}

	@Test
	@DisplayName("POST /api/v1/auth/register deve rejeitar JSON malformado")
	void deveRejeitarCadastroQuandoJsonMalformado() throws Exception {
		String payload = "{\"name\":\"Maria\",\"email\":\"maria@moni.com\",\"password\":\"Senha123\"";

		assertContratoErroPadrao(enviarPostJson(caminhoCadastro, payload), 400);
	}

	@Test
	@DisplayName("POST /api/v1/auth/register deve rejeitar content-type invalido")
	void deveRejeitarCadastroQuandoContentTypeForInvalido() throws Exception {
		String payload = "{\"name\":\"Maria\",\"email\":\"maria@moni.com\",\"password\":\"Senha123\"}";

		assertContratoErroPadrao(enviarPost(caminhoCadastro, payload, "text/plain"), 415);
	}

	@Test
	@DisplayName("POST /api/v1/auth/register deve retornar 409 para e-mail duplicado")
	void deveRetornarConflitoQuandoEmailJaCadastrado() throws Exception {
		String email = novoEmail();
		String senha = "Senha123";

		assertContratoSucessoCadastro(cadastrarUsuario("Maria", email, senha));
		assertContratoErroPadrao(cadastrarUsuario("Outra Maria", email, senha), 409);
	}

	@Test
	@DisplayName("POST /api/v1/auth/login deve retornar 200 e contrato estrito de sucesso")
	void deveRealizarLoginComSucessoQuandoCredenciaisValidas() throws Exception {
		String email = novoEmail();
		String senha = "Senha123";

		assertContratoSucessoCadastro(cadastrarUsuario("Carlos", email, senha));
		assertContratoSucessoLogin(realizarLogin(email, senha));
	}

	@Test
	@DisplayName("POST /api/v1/auth/login deve rejeitar usuario inexistente")
	void deveRejeitarLoginQuandoUsuarioInexistente() throws Exception {
		assertContratoErroPadrao(realizarLogin(novoEmail(), "Senha123"), 401);
	}

	@Test
	@DisplayName("POST /api/v1/auth/login deve rejeitar senha invalida")
	void deveRejeitarLoginQuandoSenhaInvalida() throws Exception {
		String email = novoEmail();
		String senha = "Senha123";

		assertContratoSucessoCadastro(cadastrarUsuario("Ana", email, senha));
		assertContratoErroPadrao(realizarLogin(email, "SenhaInvalida"), 401);
	}

	@ParameterizedTest(name = "[{index}] {0}")
	@MethodSource("fornecerPayloadsLoginComCamposAusentesNulosOuVazios")
	@DisplayName("POST /api/v1/auth/login deve validar campos obrigatorios ausentes, nulos e vazios")
	void deveRejeitarLoginQuandoCamposObrigatoriosAusentesNulosOuVazios(String cenario, String payload)
			throws Exception {
		assertContratoErroPadrao(enviarPostJson(caminhoLogin, payload), 400);
	}

	@Test
	@DisplayName("POST /api/v1/auth/login deve retornar token no formato JWT com 3 segmentos")
	void deveRetornarTokenJwtComTresSegmentosNoLogin() throws Exception {
		String email = novoEmail();
		String senha = "Senha123";

		assertContratoSucessoCadastro(cadastrarUsuario("Joao", email, senha));

		HttpResponse<String> resposta = realizarLogin(email, senha);
		assertContratoSucessoLogin(resposta);

		Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
		Object token = corpo.get("token");

		assertTrue(token instanceof String && padraoJwt.matcher((String) token).matches(),
				"O campo token deve seguir o formato JWT com 3 segmentos.");
	}

	private void assertContratoSucessoCadastro(HttpResponse<String> resposta) throws Exception {
		assertEquals(201, resposta.statusCode());
		assertCabecalhoJson(resposta);

		Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
		assertEquals(4, corpo.size());
		assertCampoTextoNaoVazio(corpo, "id");
		assertCampoTextoNaoVazio(corpo, "name");
		assertCampoTextoNaoVazio(corpo, "email");
		assertCampoTextoNaoVazio(corpo, "token");
	}

	private void assertContratoSucessoLogin(HttpResponse<String> resposta) throws Exception {
		assertEquals(200, resposta.statusCode());
		assertCabecalhoJson(resposta);

		Map<String, Object> corpo = lerJsonComoMapa(resposta.body());
		assertEquals(3, corpo.size());
		assertCampoTextoNaoVazio(corpo, "token");
		assertCampoTextoNaoVazio(corpo, "type");
		assertCampoPresenteENaoNulo(corpo, "userId");
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

	private HttpResponse<String> cadastrarUsuario(String nome, String email, String senha) throws Exception {
		String payload = """
				{
				  "name": "%s",
				  "email": "%s",
				  "password": "%s"
				}
				""".formatted(nome, email, senha);

		return enviarPostJson(caminhoCadastro, payload);
	}

	private HttpResponse<String> realizarLogin(String email, String senha) throws Exception {
		String payload = """
				{
				  "email": "%s",
				  "password": "%s"
				}
				""".formatted(email, senha);

		return enviarPostJson(caminhoLogin, payload);
	}

	private HttpResponse<String> enviarPostJson(String caminho, String payload) throws Exception {
		return enviarPost(caminho, payload, "application/json");
	}

	private HttpResponse<String> enviarPost(String caminho, String payload, String contentType) throws Exception {
		HttpRequest requisicao = HttpRequest.newBuilder()
				.uri(URI.create("http://localhost:" + obterPortaLocal() + caminho))
				.header("Content-Type", contentType)
				.POST(HttpRequest.BodyPublishers.ofString(payload))
				.build();

		return clienteHttp.send(requisicao, HttpResponse.BodyHandlers.ofString());
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

	private String novoEmail() {
		String sufixo = UUID.randomUUID().toString().replace("-", "");
		return "usuario+" + sufixo + "@moni.com";
	}

	private static Stream<Arguments> fornecerPayloadsCadastroComCamposAusentesNulosOuVazios() {
		return Stream.of(
				Arguments.of("campo name ausente", """
						{
						  "email": "ana@moni.com",
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo email ausente", """
						{
						  "name": "Ana",
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo password ausente", """
						{
						  "name": "Ana",
						  "email": "ana@moni.com"
						}
						"""),
				Arguments.of("campo name nulo", """
						{
						  "name": null,
						  "email": "ana@moni.com",
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo email nulo", """
						{
						  "name": "Ana",
						  "email": null,
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo password nulo", """
						{
						  "name": "Ana",
						  "email": "ana@moni.com",
						  "password": null
						}
						"""),
				Arguments.of("campo name vazio", """
						{
						  "name": "",
						  "email": "ana@moni.com",
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo email vazio", """
						{
						  "name": "Ana",
						  "email": "",
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo password vazio", """
						{
						  "name": "Ana",
						  "email": "ana@moni.com",
						  "password": ""
						}
						"""));
	}

	private static Stream<Arguments> fornecerPayloadsLoginComCamposAusentesNulosOuVazios() {
		return Stream.of(
				Arguments.of("campo email ausente", """
						{
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo password ausente", """
						{
						  "email": "ana@moni.com"
						}
						"""),
				Arguments.of("campo email nulo", """
						{
						  "email": null,
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo password nulo", """
						{
						  "email": "ana@moni.com",
						  "password": null
						}
						"""),
				Arguments.of("campo email vazio", """
						{
						  "email": "",
						  "password": "Senha123"
						}
						"""),
				Arguments.of("campo password vazio", """
						{
						  "email": "ana@moni.com",
						  "password": ""
						}
						"""));
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class ConfiguracaoSegurancaTeste {

		@Bean
		SecurityFilterChain cadeiaSeguranca(HttpSecurity http) throws Exception {
			return http
					.csrf((csrf) -> csrf.disable())
					.authorizeHttpRequests((autorizacao) -> autorizacao.anyRequest().permitAll())
					.build();
		}
	}

}