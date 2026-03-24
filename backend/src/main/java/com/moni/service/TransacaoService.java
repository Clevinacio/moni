package com.moni.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import com.moni.configuration.exception.AcessoNegadoException;
import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.configuration.exception.TransacaoNaoEncontradaException;
import com.moni.dto.AtualizarTransacaoRequest;
import com.moni.dto.CriarTransacaoRequest;
import com.moni.dto.TransacaoResponse;
import com.moni.entity.Categoria;
import com.moni.entity.CategoriaRepository;
import com.moni.entity.Transacao;
import com.moni.entity.TransacaoRepository;
import com.moni.entity.Usuario;
import com.moni.entity.UsuarioRepository;
import com.moni.mapper.TransacaoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransacaoService {

    private final TransacaoRepository transacaoRepository;
    private final CategoriaRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TransacaoMapper transacaoMapper;

    @Transactional
    public TransacaoResponse criar(Authentication autenticacao, CriarTransacaoRequest requisicao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Usuario usuario = buscarUsuario(usuarioId);
        Categoria categoria = buscarOuCriarCategoria(usuario, requisicao.categoria());

        Transacao transacao = new Transacao(
                requisicao.descricao().trim(),
                requisicao.valor(),
                requisicao.data(),
                requisicao.tipo(),
                categoria,
                usuario);

        Transacao transacaoSalva = transacaoRepository.save(transacao);
        return transacaoMapper.paraResponse(transacaoSalva);
    }

    @Transactional(readOnly = true)
    public List<TransacaoResponse> listar(Authentication autenticacao, LocalDate dataInicio, LocalDate dataFim,
            Integer mes,
            Integer ano) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        validarFiltros(dataInicio, dataFim, mes, ano);

        List<Transacao> transacoes;
        if (dataInicio != null) {
            transacoes = transacaoRepository.findByUsuarioIdAndDataBetweenOrderByDataDesc(usuarioId, dataInicio,
                    dataFim);
        } else if (mes != null) {
            YearMonth anoMes = YearMonth.of(ano, mes);
            LocalDate inicio = anoMes.atDay(1);
            LocalDate fim = anoMes.atEndOfMonth();
            transacoes = transacaoRepository.findByUsuarioIdAndDataBetweenOrderByDataDesc(usuarioId, inicio, fim);
        } else {
            transacoes = transacaoRepository.findByUsuarioIdOrderByDataDesc(usuarioId);
        }

        return transacaoMapper.paraResponses(transacoes);
    }

    @Transactional
    public TransacaoResponse atualizar(Authentication autenticacao, UUID transacaoId,
            AtualizarTransacaoRequest requisicao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Usuario usuario = buscarUsuario(usuarioId);

        Transacao transacao = transacaoRepository.findById(transacaoId)
                .orElseThrow(() -> new TransacaoNaoEncontradaException("Transacao nao encontrada."));

        if (!transacao.getUsuario().getId().equals(usuarioId)) {
            throw new AcessoNegadoException("Acesso negado para esta transacao.");
        }

        Categoria categoria = buscarOuCriarCategoria(usuario, requisicao.categoria());
        transacao.atualizar(
                requisicao.descricao().trim(),
                requisicao.valor(),
                requisicao.data(),
                requisicao.tipo(),
                categoria);

        return transacaoMapper.paraResponse(transacao);
    }

    @Transactional
    public void excluir(Authentication autenticacao, UUID transacaoId) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Transacao transacao = transacaoRepository.findById(transacaoId)
                .orElseThrow(() -> new TransacaoNaoEncontradaException("Transacao nao encontrada."));

        if (!transacao.getUsuario().getId().equals(usuarioId)) {
            throw new AcessoNegadoException("Acesso negado para esta transacao.");
        }

        transacaoRepository.delete(transacao);
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new CredenciaisInvalidasException("Usuario autenticado nao encontrado."));
    }

    private Categoria buscarOuCriarCategoria(Usuario usuario, String categoriaInformada) {
        String categoriaNormalizada = categoriaInformada.trim();

        return categoriaRepository.findByUsuarioIdAndNomeIgnoreCase(usuario.getId(), categoriaNormalizada)
                .orElseGet(() -> categoriaRepository.save(new Categoria(categoriaNormalizada, usuario)));
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

    private void validarFiltros(LocalDate dataInicio, LocalDate dataFim, Integer mes, Integer ano) {
        if ((dataInicio == null) != (dataFim == null)) {
            throw new IllegalArgumentException("dataInicio e dataFim devem ser informadas em conjunto.");
        }

        boolean filtroMensalParcial = (mes == null) != (ano == null);
        if (filtroMensalParcial) {
            throw new IllegalArgumentException("mes e ano devem ser informados em conjunto.");
        }

        if (mes != null && (mes < 1 || mes > 12)) {
            throw new IllegalArgumentException("mes deve estar entre 1 e 12.");
        }

        if (dataInicio != null && mes != null) {
            throw new IllegalArgumentException("Use filtro por intervalo ou por mes/ano, nao ambos.");
        }
    }
}
