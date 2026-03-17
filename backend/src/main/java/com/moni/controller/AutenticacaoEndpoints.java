package com.moni.controller;

import com.moni.dto.CadastroRequest;
import com.moni.dto.CadastroResponse;
import com.moni.dto.LoginRequest;
import com.moni.dto.LoginResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(path = AutenticacaoEndpoints.ROTA_BASE, produces = MediaType.APPLICATION_JSON_VALUE)
public interface AutenticacaoEndpoints {

  String ROTA_BASE = "/api/v1/auth";
  String ROTA_PUBLICA = ROTA_BASE + "/**";
  String ROTA_CADASTRO = "/register";
  String ROTA_LOGIN = "/login";

  @PostMapping(path = ROTA_CADASTRO, consumes = MediaType.APPLICATION_JSON_VALUE)
  @Operation(summary = "Cadastrar usuario", description = "Cria um novo usuario e retorna token JWT.")
  @ApiResponses(value = {
      @ApiResponse(responseCode = "201", description = "Usuario cadastrado com sucesso", content = @Content(schema = @Schema(implementation = CadastroResponse.class))),
      @ApiResponse(responseCode = "400", description = "Dados invalidos"),
      @ApiResponse(responseCode = "409", description = "E-mail ja cadastrado")
  })
  ResponseEntity<CadastroResponse> cadastrar(@Valid @RequestBody CadastroRequest requisicao);

  @PostMapping(path = ROTA_LOGIN, consumes = MediaType.APPLICATION_JSON_VALUE)
  @Operation(summary = "Autenticar usuario", description = "Valida credenciais e retorna token JWT.")
  @ApiResponses(value = {
      @ApiResponse(responseCode = "200", description = "Login realizado com sucesso", content = @Content(schema = @Schema(implementation = LoginResponse.class))),
      @ApiResponse(responseCode = "400", description = "Dados invalidos"),
      @ApiResponse(responseCode = "401", description = "Credenciais invalidas")
  })
  ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest requisicao);
}