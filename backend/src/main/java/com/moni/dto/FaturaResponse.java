package com.moni.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FaturaResponse(
        UUID id,
        String descricao,
        BigDecimal valor,
        LocalDate dataVencimento,
        boolean paga
) {
}
