package com.moni.controller;

import java.util.List;

import com.moni.dto.CategoriaResponse;
import com.moni.service.CategoriaService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Categorias", description = "Endpoints de gerenciamento de categorias")
public class CategoriaController implements CategoriaEndpoints {

    private final CategoriaService categoriaService;

    @Override
    public ResponseEntity<List<CategoriaResponse>> listar() {
        Authentication autenticacao = obterAutenticacao();
        List<CategoriaResponse> resposta = categoriaService.listar(autenticacao);
        return ResponseEntity.ok(resposta);
    }

    private Authentication obterAutenticacao() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    }
}
