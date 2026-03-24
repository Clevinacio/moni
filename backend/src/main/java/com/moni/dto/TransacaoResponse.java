package com.moni.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.moni.entity.TipoTransacao;

public record TransacaoResponse(
        String id,
        String descricao,
        BigDecimal valor,
        LocalDate data,
        TipoTransacao tipo,
        String categoria) {
}
