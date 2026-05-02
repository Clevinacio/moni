package com.moni.service;

import com.moni.configuration.exception.AcessoNegadoException;
import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.dto.CriarFaturaRequest;
import com.moni.dto.CriarTransacaoRequest;
import com.moni.dto.FaturaResponse;
import com.moni.entity.Categoria;
import com.moni.entity.CategoriaRepository;
import com.moni.entity.Fatura;
import com.moni.entity.FaturaRepository;
import com.moni.entity.Usuario;
import com.moni.entity.UsuarioRepository;
import com.moni.mapper.FaturaMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FaturaService {

    private final FaturaRepository faturaRepository;
    private final FaturaMapper faturaMapper;
    private final UsuarioRepository usuarioRepository;
    private final TransacaoService transacaoService;
    private final CategoriaRepository categoriaRepository;

    @Transactional
    public FaturaResponse criar(Authentication autenticacao, CriarFaturaRequest requisicao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Usuario usuario = buscarUsuario(usuarioId);

        Fatura fatura = faturaMapper.paraEntidade(requisicao);
        fatura.setUsuario(usuario);

        Fatura salva = faturaRepository.save(fatura);
        return faturaMapper.paraResposta(salva);
    }

    @Transactional
    public FaturaResponse pagar(Authentication autenticacao, UUID id) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        
        Fatura fatura = faturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fatura nao encontrada."));
                
        if (!fatura.getUsuario().getId().equals(usuarioId)) {
            throw new AcessoNegadoException("Acesso negado.");
        }

        if (fatura.isPaga()) {
            throw new RuntimeException("Fatura ja esta paga.");
        }

        fatura.setPaga(true);
        Fatura salva = faturaRepository.save(fatura);

        gerarTransacao(autenticacao, fatura);

        return faturaMapper.paraResposta(salva);
    }

    @Transactional(readOnly = true)
    public java.util.List<FaturaResponse> listar(Authentication autenticacao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        return faturaRepository.findByUsuarioIdOrderByDataVencimentoAsc(usuarioId)
                .stream()
                .map(faturaMapper::paraResposta)
                .toList();
    }
    
    private void gerarTransacao(Authentication autenticacao, Fatura fatura) {
        Categoria categoria = categoriaRepository.findByUsuarioIdAndNomeIgnoreCase(fatura.getUsuario().getId(), "Faturas")
                .orElseGet(() -> categoriaRepository.save(new Categoria("Faturas", fatura.getUsuario())));
                
        CriarTransacaoRequest transacaoReq = new CriarTransacaoRequest(
                "Pagamento Fatura: " + fatura.getDescricao(),
                fatura.getValor(),
                LocalDate.now(),
                com.moni.entity.TipoTransacao.DESPESA,
                new com.moni.dto.CategoriaTransacaoRequest(categoria.getId().toString(), null),
                null
        );
        
        transacaoService.criar(autenticacao, transacaoReq);
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new CredenciaisInvalidasException("Usuario autenticado nao encontrado."));
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
