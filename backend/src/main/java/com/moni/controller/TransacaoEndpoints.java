package com.moni.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.moni.dto.AtualizarTransacaoRequest;
import com.moni.dto.CriarTransacaoRequest;
import com.moni.dto.TransacaoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RequestMapping(path = TransacaoEndpoints.ROTA_BASE, produces = MediaType.APPLICATION_JSON_VALUE)
public interface TransacaoEndpoints {

    String ROTA_BASE = "/api/v1/transactions";
    String ROTA_PRIVADA = ROTA_BASE + "/**";

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Criar transacao", description = "Cria uma nova transacao para o usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Transacao criada com sucesso", content = @Content(schema = @Schema(implementation = TransacaoResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<TransacaoResponse> criar(@Valid @RequestBody CriarTransacaoRequest requisicao);

    @GetMapping
    @Operation(summary = "Listar transacoes", description = "Lista as transacoes do usuario autenticado com filtros opcionais por periodo e por mes/ano.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parametros invalidos"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<List<TransacaoResponse>> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) Integer mes,
            @RequestParam(required = false) Integer ano);

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Atualizar transacao", description = "Atualiza uma transacao existente do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transacao atualizada com sucesso", content = @Content(schema = @Schema(implementation = TransacaoResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "404", description = "Transacao nao encontrada")
    })
    ResponseEntity<TransacaoResponse> atualizar(@PathVariable UUID id,
            @Valid @RequestBody AtualizarTransacaoRequest requisicao);

    @DeleteMapping(path = "/{id}")
    @Operation(summary = "Excluir transacao", description = "Exclui uma transacao existente do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Transacao excluida com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "404", description = "Transacao nao encontrada")
    })
    ResponseEntity<Void> excluir(@PathVariable UUID id);
}
