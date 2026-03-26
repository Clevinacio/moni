package com.moni.entity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MetaRepository extends JpaRepository<Meta, UUID> {

    List<Meta> findByUsuarioIdOrderByNomeAsc(UUID usuarioId);

    Optional<Meta> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    Optional<Meta> findByUsuarioIdAndNomeIgnoreCase(UUID usuarioId, String nome);
}
