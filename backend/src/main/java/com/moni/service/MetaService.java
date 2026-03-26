package com.moni.service;

import java.util.List;
import java.util.UUID;

import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.configuration.exception.MetaNaoEncontradaException;
import com.moni.dto.AtualizarMetaRequest;
import com.moni.dto.CriarMetaRequest;
import com.moni.dto.MetaResponse;
import com.moni.entity.Meta;
import com.moni.entity.MetaRepository;
import com.moni.entity.Usuario;
import com.moni.entity.UsuarioRepository;
import com.moni.mapper.MetaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MetaService {

    private final MetaRepository metaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MetaMapper metaMapper;

    @Transactional
    public MetaResponse criar(Authentication autenticacao, CriarMetaRequest requisicao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Usuario usuario = buscarUsuario(usuarioId);

        String nomeNormalizado = requisicao.nome().trim();
        validarNomeDuplicado(usuarioId, nomeNormalizado, null);

        Meta meta = new Meta(nomeNormalizado, requisicao.valorAlvo(), usuario);
        Meta metaSalva = metaRepository.save(meta);
        return metaMapper.paraResponse(metaSalva);
    }

    @Transactional(readOnly = true)
    public List<MetaResponse> listar(Authentication autenticacao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        List<Meta> metas = metaRepository.findByUsuarioIdOrderByNomeAsc(usuarioId);
        return metaMapper.paraResponses(metas);
    }

    @Transactional(readOnly = true)
    public MetaResponse obter(Authentication autenticacao, UUID metaId) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Meta meta = buscarMetaDoUsuario(metaId, usuarioId);
        return metaMapper.paraResponse(meta);
    }

    @Transactional
    public MetaResponse atualizar(Authentication autenticacao, UUID metaId, AtualizarMetaRequest requisicao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Meta meta = buscarMetaDoUsuario(metaId, usuarioId);

        String nomeNormalizado = requisicao.nome().trim();
        validarNomeDuplicado(usuarioId, nomeNormalizado, metaId);

        if (requisicao.valorAlvo().compareTo(meta.getValorPoupado()) < 0) {
            throw new IllegalArgumentException("Valor alvo nao pode ser menor que valor poupado.");
        }

        meta.atualizar(nomeNormalizado, requisicao.valorAlvo());
        return metaMapper.paraResponse(meta);
    }

    @Transactional
    public void excluir(Authentication autenticacao, UUID metaId) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Meta meta = buscarMetaDoUsuario(metaId, usuarioId);
        metaRepository.delete(meta);
    }

    private Meta buscarMetaDoUsuario(UUID metaId, UUID usuarioId) {
        return metaRepository.findByIdAndUsuarioId(metaId, usuarioId)
                .orElseThrow(() -> new MetaNaoEncontradaException("Meta nao encontrada."));
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new CredenciaisInvalidasException("Usuario autenticado nao encontrado."));
    }

    private void validarNomeDuplicado(UUID usuarioId, String nome, UUID metaIdAtual) {
        metaRepository.findByUsuarioIdAndNomeIgnoreCase(usuarioId, nome)
                .ifPresent((metaExistente) -> {
                    boolean mesmaMeta = metaIdAtual != null && metaExistente.getId().equals(metaIdAtual);
                    if (!mesmaMeta) {
                        throw new IllegalArgumentException("Ja existe uma meta com esse nome.");
                    }
                });
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
