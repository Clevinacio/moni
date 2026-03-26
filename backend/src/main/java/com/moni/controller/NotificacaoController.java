package com.moni.controller;

import java.util.List;

import com.moni.dto.NotificacaoResponse;
import com.moni.service.NotificacaoService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Tag(name = "Notificacoes", description = "Endpoints de notificacoes in-app")
public class NotificacaoController implements NotificacaoEndpoints {

    private final NotificacaoService notificacaoService;

    @Override
    public ResponseEntity<List<NotificacaoResponse>> listar() {
        Authentication autenticacao = obterAutenticacao();
        List<NotificacaoResponse> resposta = notificacaoService.listar(autenticacao);
        return ResponseEntity.ok(resposta);
    }

    @Override
    public ResponseEntity<Void> limpar() {
        Authentication autenticacao = obterAutenticacao();
        notificacaoService.limpar(autenticacao);
        return ResponseEntity.noContent().build();
    }

    private Authentication obterAutenticacao() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    }
}