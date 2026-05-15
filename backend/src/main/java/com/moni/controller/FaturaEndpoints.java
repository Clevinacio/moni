package com.moni.controller;

import com.moni.dto.CriarFaturaRequest;
import com.moni.dto.FaturaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RequestMapping(path = FaturaEndpoints.ROTA_BASE, produces = MediaType.APPLICATION_JSON_VALUE)
public interface FaturaEndpoints {

    String ROTA_BASE = "/api/v1/bills";
    String ROTA_PRIVADA = ROTA_BASE + "/**";

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Criar fatura", description = "Cria uma nova fatura (conta a pagar) para o usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Fatura criada com sucesso", content = @Content(schema = @Schema(implementation = FaturaResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<FaturaResponse> criar(@Valid @RequestBody CriarFaturaRequest requisicao);

    @PatchMapping(path = "/{id}/pay")
    @Operation(summary = "Pagar fatura", description = "Marca a fatura do usuario autenticado como paga e gera uma transacao automatica de despesa.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Fatura paga com sucesso", content = @Content(schema = @Schema(implementation = FaturaResponse.class))),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "403", description = "Acesso negado"),
            @ApiResponse(responseCode = "404", description = "Fatura nao encontrada")
    })
    ResponseEntity<FaturaResponse> pagar(@PathVariable UUID id);

    @GetMapping
    @Operation(summary = "Listar faturas", description = "Lista as faturas do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de faturas retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<java.util.List<FaturaResponse>> listar();
}
