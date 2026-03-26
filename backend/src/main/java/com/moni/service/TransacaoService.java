package com.moni.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import com.moni.configuration.exception.AcessoNegadoException;
import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.configuration.exception.TransacaoNaoEncontradaException;
import com.moni.dto.AtualizarTransacaoRequest;
import com.moni.dto.CategoriaTransacaoRequest;
import com.moni.dto.CriarTransacaoRequest;
import com.moni.dto.TransacaoResponse;
import com.moni.entity.Categoria;
import com.moni.entity.CategoriaRepository;
import com.moni.entity.Meta;
import com.moni.entity.MetaRepository;
import com.moni.entity.TipoTransacao;
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
    private final MetaRepository metaRepository;
    private final NotificacaoService notificacaoService;
    private final TransacaoMapper transacaoMapper;

    @Transactional
    public TransacaoResponse criar(Authentication autenticacao, CriarTransacaoRequest requisicao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        Usuario usuario = buscarUsuario(usuarioId);
        Categoria categoria = buscarOuCriarCategoria(usuario, requisicao.categoria());
        Meta meta = buscarMetaSeInformada(usuarioId, requisicao.tipo(), requisicao.metaId());

        Transacao transacao = new Transacao(
                requisicao.descricao().trim(),
                requisicao.valor(),
                requisicao.data(),
                requisicao.tipo(),
                categoria,
                usuario,
                meta);

        adicionarAporteEmMetaSeAplicavel(meta, requisicao.tipo(), requisicao.valor());

        Transacao transacaoSalva = transacaoRepository.save(transacao);
        return transacaoMapper.paraResponse(transacaoSalva);
    }

    @Transactional(readOnly = true)
    public List<TransacaoResponse> listar(Authentication autenticacao, LocalDate dataInicio, LocalDate dataFim,
            Integer mes,
            Integer ano, String categoriaId) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        validarFiltros(dataInicio, dataFim, mes, ano);
        UUID categoriaUuid = converterCategoriaIdOpcional(categoriaId);

        List<Transacao> transacoes;
        if (dataInicio != null) {
            if (categoriaUuid != null) {
                transacoes = transacaoRepository.findByUsuarioIdAndCategoriaIdAndDataBetweenOrderByDataDesc(
                        usuarioId,
                        categoriaUuid,
                        dataInicio,
                        dataFim);
            } else {
                transacoes = transacaoRepository.findByUsuarioIdAndDataBetweenOrderByDataDesc(usuarioId, dataInicio,
                        dataFim);
            }
        } else if (mes != null) {
            YearMonth anoMes = YearMonth.of(ano, mes);
            LocalDate inicio = anoMes.atDay(1);
            LocalDate fim = anoMes.atEndOfMonth();
            if (categoriaUuid != null) {
                transacoes = transacaoRepository.findByUsuarioIdAndCategoriaIdAndDataBetweenOrderByDataDesc(
                        usuarioId,
                        categoriaUuid,
                        inicio,
                        fim);
            } else {
                transacoes = transacaoRepository.findByUsuarioIdAndDataBetweenOrderByDataDesc(usuarioId, inicio, fim);
            }
        } else {
            if (categoriaUuid != null) {
                transacoes = transacaoRepository.findByUsuarioIdAndCategoriaIdOrderByDataDesc(usuarioId,
                        categoriaUuid);
            } else {
                transacoes = transacaoRepository.findByUsuarioIdOrderByDataDesc(usuarioId);
            }
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

        Meta metaAnterior = transacao.getMeta();
        TipoTransacao tipoAnterior = transacao.getTipo();
        var valorAnterior = transacao.getValor();

        Categoria categoria = buscarOuCriarCategoria(usuario, requisicao.categoria());
        Meta metaAtual = buscarMetaSeInformada(usuarioId, requisicao.tipo(), requisicao.metaId());

        removerAporteDaMetaSeAplicavel(metaAnterior, tipoAnterior, valorAnterior);
        transacao.atualizar(
                requisicao.descricao().trim(),
                requisicao.valor(),
                requisicao.data(),
                requisicao.tipo(),
                categoria,
                metaAtual);
        adicionarAporteEmMetaSeAplicavel(metaAtual, requisicao.tipo(), requisicao.valor());

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

        removerAporteDaMetaSeAplicavel(transacao.getMeta(), transacao.getTipo(), transacao.getValor());

        transacaoRepository.delete(transacao);
    }

    private Meta buscarMetaSeInformada(UUID usuarioId, TipoTransacao tipo, String metaId) {
        if (metaId == null || metaId.isBlank()) {
            return null;
        }

        if (tipo != TipoTransacao.RECEITA) {
            throw new IllegalArgumentException("Meta so pode ser informada para transacoes do tipo RECEITA.");
        }

        UUID metaUuid;
        try {
            metaUuid = UUID.fromString(metaId);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Meta id invalida.");
        }

        return metaRepository.findByIdAndUsuarioId(metaUuid, usuarioId)
                .orElseThrow(() -> new AcessoNegadoException("Acesso negado para esta meta."));
    }

    private void removerAporteDaMetaSeAplicavel(Meta meta, TipoTransacao tipo, java.math.BigDecimal valor) {
        if (meta == null || tipo != TipoTransacao.RECEITA) {
            return;
        }

        meta.removerValorPoupado(valor);
        metaRepository.save(meta);
    }

    private void adicionarAporteEmMetaSeAplicavel(Meta meta, TipoTransacao tipo, java.math.BigDecimal valor) {
        if (meta == null || tipo != TipoTransacao.RECEITA) {
            return;
        }

        java.math.BigDecimal valorAnterior = meta.getValorPoupado();
        meta.adicionarValorPoupado(valor);
        metaRepository.save(meta);

        boolean metaAtingidaAgora = valorAnterior.compareTo(meta.getValorAlvo()) < 0
                && meta.getValorPoupado().compareTo(meta.getValorAlvo()) >= 0;

        if (metaAtingidaAgora) {
            notificacaoService.notificarMetaAtingida(meta);
        }
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new CredenciaisInvalidasException("Usuario autenticado nao encontrado."));
    }

    private Categoria buscarOuCriarCategoria(Usuario usuario, CategoriaTransacaoRequest categoriaInformada) {
        if (categoriaInformada == null) {
            throw new IllegalArgumentException("Categoria e obrigatoria.");
        }

        if (categoriaInformada.possuiId()) {
            return buscarCategoriaExistentePorId(usuario.getId(), categoriaInformada.id());
        }

        String categoriaNormalizada = categoriaInformada.nomeNormalizado();
        if (categoriaNormalizada == null || categoriaNormalizada.isBlank()) {
            throw new IllegalArgumentException("Categoria e obrigatoria.");
        }

        return categoriaRepository.findByUsuarioIdAndNomeIgnoreCase(usuario.getId(), categoriaNormalizada)
                .orElseGet(() -> categoriaRepository.save(new Categoria(categoriaNormalizada, usuario)));
    }

    private Categoria buscarCategoriaExistentePorId(UUID usuarioId, String categoriaId) {
        UUID categoriaUuid;
        try {
            categoriaUuid = UUID.fromString(categoriaId);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Categoria id invalida.");
        }

        return categoriaRepository.findByIdAndUsuarioId(categoriaUuid, usuarioId)
                .orElseThrow(() -> new AcessoNegadoException("Acesso negado para esta categoria."));
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

    private UUID converterCategoriaIdOpcional(String categoriaId) {
        if (categoriaId == null || categoriaId.isBlank()) {
            return null;
        }

        try {
            return UUID.fromString(categoriaId);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("categoriaId invalido.");
        }
    }
}
