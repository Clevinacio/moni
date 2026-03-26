package com.moni.entity;

import java.time.OffsetDateTime;
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
@Table(name = "notificacoes")
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, length = 220)
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoNotificacao tipo;

    @Column(nullable = false)
    private boolean lida;

    @Column(name = "criada_em", nullable = false)
    private OffsetDateTime criadaEm;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    public Notificacao(String mensagem, TipoNotificacao tipo, Usuario usuario) {
        this.mensagem = mensagem;
        this.tipo = tipo;
        this.usuario = usuario;
        this.lida = false;
        this.criadaEm = OffsetDateTime.now();
    }
}
