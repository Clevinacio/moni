package com.moni.dto;

import java.math.BigDecimal;

public record MetaResponse(
        String id,
        String nome,
        BigDecimal valorAlvo,
        BigDecimal valorPoupado) {
}
