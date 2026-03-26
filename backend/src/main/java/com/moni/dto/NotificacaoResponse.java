package com.moni.dto;

import java.time.OffsetDateTime;

public record NotificacaoResponse(
        String id,
        String mensagem,
        String tipo,
        boolean lida,
        OffsetDateTime criadaEm) {
}