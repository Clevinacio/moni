package com.moni.controller;

import java.util.List;
import java.util.UUID;

import com.moni.dto.AtualizarMetaRequest;
import com.moni.dto.CriarMetaRequest;
import com.moni.dto.MetaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(path = MetaEndpoints.ROTA_BASE, produces = MediaType.APPLICATION_JSON_VALUE)
public interface MetaEndpoints {

    String ROTA_BASE = "/api/v1/goals";
    String ROTA_PRIVADA = ROTA_BASE + "/**";

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Criar meta", description = "Cria uma nova meta para o usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Meta criada com sucesso", content = @Content(schema = @Schema(implementation = MetaResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<MetaResponse> criar(@Valid @RequestBody CriarMetaRequest requisicao);

    @GetMapping
    @Operation(summary = "Listar metas", description = "Lista as metas do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<List<MetaResponse>> listar();

    @GetMapping(path = "/{id}")
    @Operation(summary = "Obter meta", description = "Obtem uma meta do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Meta obtida com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "404", description = "Meta nao encontrada")
    })
    ResponseEntity<MetaResponse> obter(@PathVariable UUID id);

    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Atualizar meta", description = "Atualiza uma meta do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Meta atualizada com sucesso", content = @Content(schema = @Schema(implementation = MetaResponse.class))),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "404", description = "Meta nao encontrada")
    })
    ResponseEntity<MetaResponse> atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarMetaRequest requisicao);

    @DeleteMapping(path = "/{id}")
    @Operation(summary = "Excluir meta", description = "Exclui uma meta do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Meta excluida com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado"),
            @ApiResponse(responseCode = "404", description = "Meta nao encontrada")
    })
    ResponseEntity<Void> excluir(@PathVariable UUID id);
}
