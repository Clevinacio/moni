package com.moni.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "transacoes")
public class Transacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 180)
    private String descricao;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate data;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoTransacao tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "meta_id", nullable = true)
    private Meta meta;

    public Transacao(String descricao, BigDecimal valor, LocalDate data, TipoTransacao tipo, Categoria categoria,
            Usuario usuario) {
        this(descricao, valor, data, tipo, categoria, usuario, null);
    }

    public Transacao(String descricao, BigDecimal valor, LocalDate data, TipoTransacao tipo, Categoria categoria,
            Usuario usuario, Meta meta) {
        this.descricao = descricao;
        this.valor = valor;
        this.data = data;
        this.tipo = tipo;
        this.categoria = categoria;
        this.usuario = usuario;
        this.meta = meta;
    }

    public void atualizar(String descricao, BigDecimal valor, LocalDate data, TipoTransacao tipo, Categoria categoria) {
        atualizar(descricao, valor, data, tipo, categoria, null);
    }

    public void atualizar(String descricao, BigDecimal valor, LocalDate data, TipoTransacao tipo, Categoria categoria,
            Meta meta) {
        this.descricao = descricao;
        this.valor = valor;
        this.data = data;
        this.tipo = tipo;
        this.categoria = categoria;
        this.meta = meta;
    }
}
