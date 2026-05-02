package com.moni.entity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FaturaRepository extends JpaRepository<Fatura, UUID> {
    List<Fatura> findByUsuarioIdOrderByDataVencimentoAsc(UUID usuarioId);
}
