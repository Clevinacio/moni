package com.moni.controller;

import java.util.List;

import com.moni.dto.CategoriaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RequestMapping(path = CategoriaEndpoints.ROTA_BASE, produces = MediaType.APPLICATION_JSON_VALUE)
public interface CategoriaEndpoints {

    String ROTA_BASE = "/api/v1/categories";
    String ROTA_PRIVADA = ROTA_BASE + "/**";

    @GetMapping
    @Operation(summary = "Listar categorias", description = "Lista as categorias do usuario autenticado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista retornada com sucesso"),
            @ApiResponse(responseCode = "401", description = "Nao autenticado")
    })
    @Valid
    ResponseEntity<List<CategoriaResponse>> listar();
}
