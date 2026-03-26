package com.moni.controller;

import java.util.List;
import java.util.UUID;

import com.moni.dto.AtualizarMetaRequest;
import com.moni.dto.CriarMetaRequest;
import com.moni.dto.MetaResponse;
import com.moni.service.MetaService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Metas", description = "Endpoints de gerenciamento de metas")
public class MetaController implements MetaEndpoints {

    private final MetaService metaService;

    @Override
    public ResponseEntity<MetaResponse> criar(@Valid @RequestBody CriarMetaRequest requisicao) {
        Authentication autenticacao = obterAutenticacao();
        MetaResponse resposta = metaService.criar(autenticacao, requisicao);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @Override
    public ResponseEntity<List<MetaResponse>> listar() {
        Authentication autenticacao = obterAutenticacao();
        List<MetaResponse> resposta = metaService.listar(autenticacao);
        return ResponseEntity.ok(resposta);
    }

    @Override
    public ResponseEntity<MetaResponse> obter(UUID id) {
        Authentication autenticacao = obterAutenticacao();
        MetaResponse resposta = metaService.obter(autenticacao, id);
        return ResponseEntity.ok(resposta);
    }

    @Override
    public ResponseEntity<MetaResponse> atualizar(UUID id, @Valid @RequestBody AtualizarMetaRequest requisicao) {
        Authentication autenticacao = obterAutenticacao();
        MetaResponse resposta = metaService.atualizar(autenticacao, id, requisicao);
        return ResponseEntity.ok(resposta);
    }

    @Override
    public ResponseEntity<Void> excluir(UUID id) {
        Authentication autenticacao = obterAutenticacao();
        metaService.excluir(autenticacao, id);
        return ResponseEntity.noContent().build();
    }

    private Authentication obterAutenticacao() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    }
}
