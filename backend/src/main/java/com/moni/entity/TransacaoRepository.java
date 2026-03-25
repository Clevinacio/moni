package com.moni.entity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TransacaoRepository extends JpaRepository<Transacao, UUID> {

    Optional<Transacao> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    List<Transacao> findByUsuarioIdOrderByDataDesc(UUID usuarioId);

    List<Transacao> findByUsuarioIdAndCategoriaIdOrderByDataDesc(UUID usuarioId, UUID categoriaId);

    List<Transacao> findByUsuarioIdAndDataBetweenOrderByDataDesc(UUID usuarioId, LocalDate dataInicio,
            LocalDate dataFim);

    List<Transacao> findByUsuarioIdAndCategoriaIdAndDataBetweenOrderByDataDesc(UUID usuarioId, UUID categoriaId,
            LocalDate dataInicio, LocalDate dataFim);
}
