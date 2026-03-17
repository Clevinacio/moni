package com.moni.configuration;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import com.moni.entity.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

	private final SecretKey chaveAssinatura;
	private final long expiracaoSegundos;

	public JwtService(
			@Value("${moni.jwt.secret}") String segredo,
			@Value("${moni.jwt.expiration-seconds}") long expiracaoSegundos) {
		this.chaveAssinatura = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
		this.expiracaoSegundos = expiracaoSegundos;
	}

	public String gerarToken(Usuario usuario) {
		Instant agora = Instant.now();
		Instant expiraEm = agora.plusSeconds(expiracaoSegundos);

		return Jwts.builder()
				.subject(usuario.getId().toString())
				.claim("email", usuario.getEmail())
				.issuedAt(Date.from(agora))
				.expiration(Date.from(expiraEm))
				.signWith(chaveAssinatura)
				.compact();
	}
}