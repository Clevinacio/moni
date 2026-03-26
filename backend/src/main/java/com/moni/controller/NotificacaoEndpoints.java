package com.moni.controller;

import java.util.List;

import com.moni.dto.NotificacaoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(path = NotificacaoEndpoints.ROTA_BASE, produces = MediaType.APPLICATION_JSON_VALUE)
public interface NotificacaoEndpoints {

    String ROTA_BASE = "/api/v1/notifications";
    String ROTA_PRIVADA = ROTA_BASE + "/**";

    @GetMapping
    @Operation(summary = "Listar notificacoes", description = "Lista as notificacoes do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<List<NotificacaoResponse>> listar();

    @DeleteMapping
    @Operation(summary = "Limpar notificacoes", description = "Remove todas as notificacoes do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Notificacoes removidas com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    ResponseEntity<Void> limpar();
}