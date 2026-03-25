package com.moni.service;

import java.util.List;
import java.util.UUID;

import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.dto.CategoriaResponse;
import com.moni.entity.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(Authentication autenticacao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);

        return categoriaRepository.findByUsuarioIdOrderByNomeAsc(usuarioId)
                .stream()
                .map((categoria) -> new CategoriaResponse(categoria.getId().toString(), categoria.getNome()))
                .toList();
    }

    private UUID extrairUsuarioId(Authentication autenticacao) {
        if (autenticacao == null || !autenticacao.isAuthenticated() || autenticacao.getName() == null
                || autenticacao.getName().isBlank()) {
            throw new CredenciaisInvalidasException("Credenciais invalidas.");
        }

        try {
            return UUID.fromString(autenticacao.getName());
        } catch (IllegalArgumentException exception) {
            throw new CredenciaisInvalidasException("Credenciais invalidas.");
        }
    }
}
