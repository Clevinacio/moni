package com.moni.entity;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {

    Optional<Categoria> findByIdAndUsuarioId(UUID id, UUID usuarioId);

    Optional<Categoria> findByUsuarioIdAndNomeIgnoreCase(UUID usuarioId, String nome);

    List<Categoria> findByUsuarioIdOrderByNomeAsc(UUID usuarioId);
}
