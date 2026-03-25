package com.moni.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

public record CategoriaTransacaoRequest(
        @Size(max = 36, message = "Categoria id deve ter no maximo 36 caracteres.") String id,
        @Size(max = 100, message = "Categoria deve ter no maximo 100 caracteres.") String nome) {

    public boolean possuiId() {
        return id != null && !id.isBlank();
    }

    public boolean possuiNome() {
        return nome != null && !nome.isBlank();
    }

    public String nomeNormalizado() {
        return nome == null ? null : nome.trim();
    }

    @AssertTrue(message = "Categoria e obrigatoria.")
    public boolean isCategoriaInformada() {
        return possuiId() || possuiNome();
    }

    @AssertTrue(message = "Categoria deve informar apenas id ou nome.")
    public boolean isCategoriaExclusiva() {
        return !(possuiId() && possuiNome());
    }
}