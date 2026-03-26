package com.moni.entity;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    List<Notificacao> findByUsuarioIdOrderByCriadaEmDesc(UUID usuarioId);

    long deleteByUsuarioId(UUID usuarioId);
}
