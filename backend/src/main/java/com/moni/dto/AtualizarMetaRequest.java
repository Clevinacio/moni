package com.moni.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarMetaRequest(
        @NotBlank(message = "Nome e obrigatorio.") @Size(max = 120, message = "Nome deve ter no maximo 120 caracteres.") String nome,
        @NotNull(message = "Valor alvo e obrigatorio.") @DecimalMin(value = "0.01", message = "Valor alvo deve ser maior que zero.") BigDecimal valorAlvo) {
}
