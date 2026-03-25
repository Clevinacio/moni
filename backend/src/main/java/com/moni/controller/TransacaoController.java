package com.moni.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.moni.dto.AtualizarTransacaoRequest;
import com.moni.dto.CriarTransacaoRequest;
import com.moni.dto.TransacaoResponse;
import com.moni.service.TransacaoService;
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
@Tag(name = "Transacoes", description = "Endpoints de gerenciamento de transacoes")
public class TransacaoController implements TransacaoEndpoints {

    private final TransacaoService transacaoService;

    @Override
    public ResponseEntity<TransacaoResponse> criar(@Valid @RequestBody CriarTransacaoRequest requisicao) {
        Authentication autenticacao = obterAutenticacao();
        TransacaoResponse resposta = transacaoService.criar(autenticacao, requisicao);
        return ResponseEntity.status(HttpStatus.CREATED).body(resposta);
    }

    @Override
    public ResponseEntity<List<TransacaoResponse>> listar(LocalDate dataInicio, LocalDate dataFim, Integer mes,
            Integer ano, String categoriaId) {
        Authentication autenticacao = obterAutenticacao();
        List<TransacaoResponse> resposta = transacaoService.listar(autenticacao, dataInicio, dataFim, mes, ano,
                categoriaId);
        return ResponseEntity.ok(resposta);
    }

    @Override
    public ResponseEntity<TransacaoResponse> atualizar(UUID id,
            @Valid @RequestBody AtualizarTransacaoRequest requisicao) {
        Authentication autenticacao = obterAutenticacao();
        TransacaoResponse resposta = transacaoService.atualizar(autenticacao, id, requisicao);
        return ResponseEntity.ok(resposta);
    }

    @Override
    public ResponseEntity<Void> excluir(UUID id) {
        Authentication autenticacao = obterAutenticacao();
        transacaoService.excluir(autenticacao, id);
        return ResponseEntity.noContent().build();
    }

    private Authentication obterAutenticacao() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    }
}
