package com.moni.configuration;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;

import com.moni.controller.AutenticacaoEndpoints;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@Profile("!test")
public class SecurityConfig {

	private static final String[] ROTAS_PUBLICAS = {
			AutenticacaoEndpoints.ROTA_PUBLICA,
			"/ws/notificacoes/**",
			"/v3/api-docs/**",
			"/swagger-ui/**",
			"/swagger-ui.html"
	};

	@Value("${moni.cors.allowed-origins}")
	private String origensPermitidas;

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuracao = new CorsConfiguration();
		configuracao.setAllowedOrigins(Arrays.asList(origensPermitidas.split(",")));
		configuracao.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		configuracao.setAllowedHeaders(Arrays.asList("*"));
		configuracao.setAllowCredentials(true);
		configuracao.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuracao);
		return source;
	}

	@Bean
	@ConditionalOnMissingBean(SecurityFilterChain.class)
	SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
			throws Exception {
		return http
				.cors((cors) -> cors.configurationSource(corsConfigurationSource()))
				.csrf(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.sessionManagement((sessao) -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling((exceptionHandling) -> exceptionHandling
						.authenticationEntryPoint(
								(requisicao, resposta, exception) -> escreverErro(resposta, HttpStatus.UNAUTHORIZED,
										"Credenciais invalidas."))
						.accessDeniedHandler(
								(requisicao, resposta, exception) -> escreverErro(resposta, HttpStatus.FORBIDDEN,
										"Acesso negado.")))
				.authorizeHttpRequests((autorizacao) -> autorizacao
						.requestMatchers(ROTAS_PUBLICAS)
						.permitAll()
						.anyRequest().authenticated())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
				.build();
	}

	private void escreverErro(HttpServletResponse resposta, HttpStatus status, String mensagem) throws IOException {
		String mensagemEscapada = mensagem.replace("\"", "\\\"");
		String erro = """
				{"timestamp":"%s","status":%d,"erro":"%s","mensagem":"%s"}
				""".formatted(OffsetDateTime.now(ZoneOffset.UTC), status.value(), status.getReasonPhrase(),
				mensagemEscapada);

		resposta.setStatus(status.value());
		resposta.setContentType(MediaType.APPLICATION_JSON_VALUE);
		resposta.setCharacterEncoding("UTF-8");
		resposta.getWriter().write(erro);
	}
}