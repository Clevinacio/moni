package com.moni.controller;

import com.moni.dto.CadastroRequest;
import com.moni.dto.CadastroResponse;
import com.moni.dto.LoginRequest;
import com.moni.dto.LoginResponse;
import com.moni.service.AutenticacaoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Autenticacao", description = "Endpoints de cadastro e login")
public class AutenticacaoController implements AutenticacaoEndpoints {

	private final AutenticacaoService autenticacaoService;

	@Override
	public ResponseEntity<CadastroResponse> cadastrar(@Valid @RequestBody CadastroRequest requisicao) {
		CadastroResponse resposta = autenticacaoService.cadastrar(requisicao);
		return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
	}

	@Override
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest requisicao) {
		LoginResponse resposta = autenticacaoService.autenticar(requisicao);
		return ResponseEntity.ok(resposta);
	}
}