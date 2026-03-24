package com.moni.entity;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {

    Optional<Categoria> findByUsuarioIdAndNomeIgnoreCase(UUID usuarioId, String nome);
}
