package com.moni.transacao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.moni.configuration.exception.AcessoNegadoException;
import com.moni.configuration.exception.TransacaoNaoEncontradaException;
import com.moni.dto.CriarTransacaoRequest;
import com.moni.dto.TransacaoResponse;
import com.moni.entity.Categoria;
import com.moni.entity.CategoriaRepository;
import com.moni.entity.TipoTransacao;
import com.moni.entity.Transacao;
import com.moni.entity.TransacaoRepository;
import com.moni.entity.Usuario;
import com.moni.entity.UsuarioRepository;
import com.moni.mapper.TransacaoMapper;
import com.moni.service.TransacaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TransacaoServiceTest {

    @Mock
    private TransacaoRepository transacaoRepository;
    @Mock
    private CategoriaRepository categoriaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TransacaoMapper transacaoMapper;

    private TransacaoService transacaoService;

    @BeforeEach
    void setUp() {
        transacaoService = new TransacaoService(transacaoRepository, categoriaRepository, usuarioRepository,
                transacaoMapper);
    }

    @Test
    @DisplayName("deve criar transacao com sucesso quando autenticacao e payload sao validos")
    void deveCriarTransacaoComSucesso() {
        UUID usuarioId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);
        Usuario usuario = usuarioComId(usuarioId);
        Categoria categoria = categoriaComId("Trabalho", usuario);
        Transacao transacaoSalva = transacaoComId(usuario, categoria, "Salario");

        CriarTransacaoRequest requisicao = new CriarTransacaoRequest(
                "Salario",
                new BigDecimal("3000.00"),
                LocalDate.of(2026, 3, 20),
                TipoTransacao.RECEITA,
                "Trabalho");

        TransacaoResponse respostaEsperada = new TransacaoResponse(
                transacaoSalva.getId().toString(),
                "Salario",
                new BigDecimal("3000.00"),
                LocalDate.of(2026, 3, 20),
                TipoTransacao.RECEITA,
                "Trabalho");

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(categoriaRepository.findByUsuarioIdAndNomeIgnoreCase(eq(usuarioId), eq("Trabalho")))
                .thenReturn(Optional.of(categoria));
        when(transacaoRepository.save(any(Transacao.class))).thenReturn(transacaoSalva);
        when(transacaoMapper.paraResponse(transacaoSalva)).thenReturn(respostaEsperada);

        TransacaoResponse resposta = transacaoService.criar(autenticacao, requisicao);

        assertEquals(respostaEsperada, resposta);
        verify(transacaoRepository).save(any(Transacao.class));
    }

    @Test
    @DisplayName("deve impedir atualizacao de transacao de outro usuario")
    void deveImpedirAtualizacaoQuandoTransacaoEhDeOutroUsuario() {
        UUID usuarioAutenticadoId = UUID.randomUUID();
        UUID usuarioDonoTransacaoId = UUID.randomUUID();
        UUID transacaoId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioAutenticadoId);

        Usuario usuarioAutenticado = usuarioComId(usuarioAutenticadoId);
        Usuario usuarioDonoTransacao = usuarioComId(usuarioDonoTransacaoId);
        Categoria categoria = categoriaComId("Casa", usuarioDonoTransacao);
        Transacao transacao = transacaoComId(usuarioDonoTransacao, categoria, "Internet");
        ReflectionTestUtils.setField(transacao, "id", transacaoId);

        when(usuarioRepository.findById(usuarioAutenticadoId)).thenReturn(Optional.of(usuarioAutenticado));
        when(transacaoRepository.findById(transacaoId)).thenReturn(Optional.of(transacao));

        var requisicao = new com.moni.dto.AtualizarTransacaoRequest(
                "Internet Fibra",
                new BigDecimal("120.00"),
                LocalDate.of(2026, 3, 16),
                TipoTransacao.DESPESA,
                "Casa");

        assertThrows(AcessoNegadoException.class,
                () -> transacaoService.atualizar(autenticacao, transacaoId, requisicao));
    }

    @Test
    @DisplayName("deve lancar excecao ao excluir transacao inexistente")
    void deveLancarExcecaoAoExcluirTransacaoInexistente() {
        UUID usuarioId = UUID.randomUUID();
        UUID transacaoId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);

        when(transacaoRepository.findById(transacaoId)).thenReturn(Optional.empty());

        assertThrows(TransacaoNaoEncontradaException.class,
                () -> transacaoService.excluir(autenticacao, transacaoId));
    }

    private Authentication autenticacao(UUID usuarioId) {
        return UsernamePasswordAuthenticationToken.authenticated(usuarioId.toString(), null, Collections.emptyList());
    }

    private Usuario usuarioComId(UUID usuarioId) {
        Usuario usuario = new Usuario("Usuario Teste", "usuario@moni.com", "hash");
        ReflectionTestUtils.setField(usuario, "id", usuarioId);
        return usuario;
    }

    private Categoria categoriaComId(String nome, Usuario usuario) {
        Categoria categoria = new Categoria(nome, usuario);
        ReflectionTestUtils.setField(categoria, "id", UUID.randomUUID());
        return categoria;
    }

    private Transacao transacaoComId(Usuario usuario, Categoria categoria, String descricao) {
        Transacao transacao = new Transacao(
                descricao,
                new BigDecimal("3000.00"),
                LocalDate.of(2026, 3, 20),
                TipoTransacao.RECEITA,
                categoria,
                usuario);
        ReflectionTestUtils.setField(transacao, "id", UUID.randomUUID());
        return transacao;
    }
}
