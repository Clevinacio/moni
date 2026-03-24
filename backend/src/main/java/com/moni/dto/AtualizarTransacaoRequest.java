package com.moni.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.moni.entity.TipoTransacao;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarTransacaoRequest(
        @NotBlank(message = "Descricao e obrigatoria.") @Size(max = 180, message = "Descricao deve ter no maximo 180 caracteres.") String descricao,
        @NotNull(message = "Valor e obrigatorio.") @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero.") BigDecimal valor,
        @NotNull(message = "Data e obrigatoria.") LocalDate data,
        @NotNull(message = "Tipo e obrigatorio.") TipoTransacao tipo,
        @NotBlank(message = "Categoria e obrigatoria.") @Size(max = 100, message = "Categoria deve ter no maximo 100 caracteres.") String categoria) {
}
