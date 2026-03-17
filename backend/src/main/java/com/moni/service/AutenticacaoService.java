package com.moni.service;

import java.util.Locale;

import com.moni.configuration.JwtService;
import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.configuration.exception.EmailJaCadastradoException;
import com.moni.dto.CadastroRequest;
import com.moni.dto.CadastroResponse;
import com.moni.dto.LoginRequest;
import com.moni.dto.LoginResponse;
import com.moni.entity.Usuario;
import com.moni.entity.UsuarioRepository;
import com.moni.mapper.AutenticacaoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AutenticacaoService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AutenticacaoMapper autenticacaoMapper;

	@Transactional
	public CadastroResponse cadastrar(CadastroRequest requisicao) {
		String emailNormalizado = normalizarEmail(requisicao.email());

		if (usuarioRepository.existsByEmail(emailNormalizado)) {
			throw new EmailJaCadastradoException("E-mail ja cadastrado.");
		}

		Usuario novoUsuario = new Usuario(
				requisicao.name().trim(),
				emailNormalizado,
				passwordEncoder.encode(requisicao.password()));

		Usuario usuarioSalvo = usuarioRepository.save(novoUsuario);
		String token = jwtService.gerarToken(usuarioSalvo);

		return autenticacaoMapper.paraCadastroResponse(usuarioSalvo, token);
	}

	@Transactional(readOnly = true)
	public LoginResponse autenticar(LoginRequest requisicao) {
		String emailNormalizado = normalizarEmail(requisicao.email());

		Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
				.orElseThrow(() -> new CredenciaisInvalidasException("Credenciais invalidas."));

		if (!passwordEncoder.matches(requisicao.password(), usuario.getSenhaHash())) {
			throw new CredenciaisInvalidasException("Credenciais invalidas.");
		}

		String token = jwtService.gerarToken(usuario);

		return autenticacaoMapper.paraLoginResponse(usuario, token);
	}

	private String normalizarEmail(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}