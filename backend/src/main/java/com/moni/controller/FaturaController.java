package com.moni.controller;

import com.moni.dto.CriarFaturaRequest;
import com.moni.dto.FaturaResponse;
import com.moni.service.FaturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class FaturaController implements FaturaEndpoints {

    private final FaturaService faturaService;

    @Override
    public ResponseEntity<FaturaResponse> criar(@Valid @RequestBody CriarFaturaRequest requisicao) {
        Authentication autenticacao = obterAutenticacao();
        FaturaResponse resposta = faturaService.criar(autenticacao, requisicao);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @Override
    public ResponseEntity<FaturaResponse> pagar(@PathVariable UUID id) {
        Authentication autenticacao = obterAutenticacao();
        FaturaResponse resposta = faturaService.pagar(autenticacao, id);
        return ResponseEntity.ok(resposta);
    }

    @Override
    @GetMapping
    public ResponseEntity<java.util.List<FaturaResponse>> listar() {
        Authentication autenticacao = obterAutenticacao();
        java.util.List<FaturaResponse> resposta = faturaService.listar(autenticacao);
        return ResponseEntity.ok(resposta);
    }

    private Authentication obterAutenticacao() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
}
