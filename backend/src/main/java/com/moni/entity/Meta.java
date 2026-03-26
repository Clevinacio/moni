package com.moni.entity;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "metas", uniqueConstraints = {
        @UniqueConstraint(name = "uk_metas_usuario_nome", columnNames = { "usuario_id", "nome" })
})
public class Meta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(name = "valor_alvo", nullable = false, precision = 19, scale = 2)
    private BigDecimal valorAlvo;

    @Column(name = "valor_poupado", nullable = false, precision = 19, scale = 2)
    private BigDecimal valorPoupado;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    public Meta(String nome, BigDecimal valorAlvo, Usuario usuario) {
        this.nome = nome;
        this.valorAlvo = valorAlvo;
        this.valorPoupado = BigDecimal.ZERO;
        this.usuario = usuario;
    }

    public void adicionarValorPoupado(BigDecimal valor) {
        this.valorPoupado = this.valorPoupado.add(valor);
    }

    public void removerValorPoupado(BigDecimal valor) {
        BigDecimal resultado = this.valorPoupado.subtract(valor);
        this.valorPoupado = resultado.signum() < 0 ? BigDecimal.ZERO : resultado;
    }

    public void atualizar(String nome, BigDecimal valorAlvo) {
        this.nome = nome;
        this.valorAlvo = valorAlvo;
    }
}
