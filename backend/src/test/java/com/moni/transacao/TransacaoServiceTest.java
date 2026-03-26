package com.moni.transacao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.moni.configuration.exception.AcessoNegadoException;
import com.moni.configuration.exception.TransacaoNaoEncontradaException;
import com.moni.dto.CategoriaTransacaoRequest;
import com.moni.dto.AtualizarTransacaoRequest;
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
import com.moni.service.NotificacaoService;
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
        private MetaRepository metaRepository;
        @Mock
        private NotificacaoService notificacaoService;
        @Mock
        private TransacaoMapper transacaoMapper;

        private TransacaoService transacaoService;

        @BeforeEach
        void setUp() {
                transacaoService = new TransacaoService(transacaoRepository, categoriaRepository, usuarioRepository,
                                metaRepository, notificacaoService, transacaoMapper);
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
                                new CategoriaTransacaoRequest(null, "Trabalho"),
                                null);

                TransacaoResponse respostaEsperada = new TransacaoResponse(
                                transacaoSalva.getId().toString(),
                                "Salario",
                                new BigDecimal("3000.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.RECEITA,
                                "Trabalho",
                                null);

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
                                new CategoriaTransacaoRequest(null, "Casa"),
                                null);

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

        @Test
        @DisplayName("deve criar transacao com categoria existente por id")
        void deveCriarTransacaoComCategoriaExistentePorId() {
                UUID usuarioId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);
                Usuario usuario = usuarioComId(usuarioId);
                Categoria categoria = categoriaComId("Moradia", usuario);
                UUID categoriaId = categoria.getId();
                Transacao transacaoSalva = transacaoComId(usuario, categoria, "Aluguel");

                CriarTransacaoRequest requisicao = new CriarTransacaoRequest(
                                "Aluguel",
                                new BigDecimal("1500.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.DESPESA,
                                new CategoriaTransacaoRequest(categoriaId.toString(), null),
                                null);

                TransacaoResponse respostaEsperada = new TransacaoResponse(
                                transacaoSalva.getId().toString(),
                                "Aluguel",
                                new BigDecimal("1500.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.DESPESA,
                                "Moradia",
                                null);

                when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
                when(categoriaRepository.findByIdAndUsuarioId(categoriaId, usuarioId))
                                .thenReturn(Optional.of(categoria));
                when(transacaoRepository.save(any(Transacao.class))).thenReturn(transacaoSalva);
                when(transacaoMapper.paraResponse(transacaoSalva)).thenReturn(respostaEsperada);

                TransacaoResponse resposta = transacaoService.criar(autenticacao, requisicao);

                assertEquals(respostaEsperada, resposta);
                verify(categoriaRepository).findByIdAndUsuarioId(categoriaId, usuarioId);
                verify(transacaoRepository).save(any(Transacao.class));
        }

        @Test
        @DisplayName("deve rejeitar categoria por id quando categoria nao pertence ao usuario autenticado")
        void deveRejeitarCategoriaIdDeOutroUsuario() {
                UUID usuarioId = UUID.randomUUID();
                UUID categoriaId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);
                Usuario usuario = usuarioComId(usuarioId);

                CriarTransacaoRequest requisicao = new CriarTransacaoRequest(
                                "Investimento",
                                new BigDecimal("250.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.RECEITA,
                                new CategoriaTransacaoRequest(categoriaId.toString(), null),
                                null);

                when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
                when(categoriaRepository.findByIdAndUsuarioId(categoriaId, usuarioId)).thenReturn(Optional.empty());

                assertThrows(AcessoNegadoException.class, () -> transacaoService.criar(autenticacao, requisicao));
        }

        @Test
        @DisplayName("deve listar transacoes filtrando por mes, ano e categoria")
        void deveListarTransacoesFiltrandoPorMesAnoECategoria() {
                UUID usuarioId = UUID.randomUUID();
                UUID categoriaId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);
                Usuario usuario = usuarioComId(usuarioId);
                Categoria categoria = categoriaComId("Trabalho", usuario);
                Transacao transacao = transacaoComId(usuario, categoria, "Freelance");
                ReflectionTestUtils.setField(categoria, "id", categoriaId);

                when(transacaoRepository.findByUsuarioIdAndCategoriaIdAndDataBetweenOrderByDataDesc(
                                eq(usuarioId),
                                eq(categoriaId),
                                eq(LocalDate.of(2026, 3, 1)),
                                eq(LocalDate.of(2026, 3, 31))))
                                .thenReturn(List.of(transacao));
                when(transacaoMapper.paraResponses(List.of(transacao))).thenReturn(List.of(new TransacaoResponse(
                                transacao.getId().toString(),
                                transacao.getDescricao(),
                                transacao.getValor(),
                                transacao.getData(),
                                transacao.getTipo(),
                                categoria.getNome(),
                                null)));

                List<TransacaoResponse> resposta = transacaoService.listar(
                                autenticacao,
                                null,
                                null,
                                3,
                                2026,
                                categoriaId.toString());

                assertEquals(1, resposta.size());
                verify(transacaoRepository).findByUsuarioIdAndCategoriaIdAndDataBetweenOrderByDataDesc(
                                usuarioId,
                                categoriaId,
                                LocalDate.of(2026, 3, 1),
                                LocalDate.of(2026, 3, 31));
        }

        @Test
        @DisplayName("deve rejeitar listagem quando categoriaId for invalido")
        void deveRejeitarListagemQuandoCategoriaIdForInvalido() {
                UUID usuarioId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);

                assertThrows(IllegalArgumentException.class,
                                () -> transacaoService.listar(autenticacao, null, null, null, null, "abc"));
        }

        @Test
        @DisplayName("deve criar receita com meta e incrementar valor poupado")
        void deveCriarReceitaComMetaEIncrementarValorPoupado() {
                UUID usuarioId = UUID.randomUUID();
                UUID metaId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);
                Usuario usuario = usuarioComId(usuarioId);
                Categoria categoria = categoriaComId("Trabalho", usuario);
                Meta meta = metaComId("Viagem", new BigDecimal("10000.00"), new BigDecimal("1500.00"), usuario);
                ReflectionTestUtils.setField(meta, "id", metaId);
                Transacao transacaoSalva = transacaoComId(usuario, categoria, "Freelance");

                CriarTransacaoRequest requisicao = new CriarTransacaoRequest(
                                "Freelance",
                                new BigDecimal("500.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.RECEITA,
                                new CategoriaTransacaoRequest(null, "Trabalho"),
                                metaId.toString());

                TransacaoResponse respostaEsperada = new TransacaoResponse(
                                transacaoSalva.getId().toString(),
                                "Freelance",
                                new BigDecimal("3000.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.RECEITA,
                                "Trabalho",
                                metaId.toString());

                ReflectionTestUtils.setField(transacaoSalva, "meta", meta);

                when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
                when(categoriaRepository.findByUsuarioIdAndNomeIgnoreCase(eq(usuarioId), eq("Trabalho")))
                                .thenReturn(Optional.of(categoria));
                when(metaRepository.findByIdAndUsuarioId(metaId, usuarioId)).thenReturn(Optional.of(meta));
                when(transacaoRepository.save(any(Transacao.class))).thenReturn(transacaoSalva);
                when(transacaoMapper.paraResponse(transacaoSalva)).thenReturn(respostaEsperada);

                TransacaoResponse resposta = transacaoService.criar(autenticacao, requisicao);

                assertEquals(respostaEsperada, resposta);
                assertEquals(new BigDecimal("2000.00"), meta.getValorPoupado());
                verify(metaRepository).save(meta);
        }

        @Test
        @DisplayName("deve rejeitar metaId quando tipo for despesa")
        void deveRejeitarMetaIdQuandoTipoForDespesa() {
                UUID usuarioId = UUID.randomUUID();
                UUID metaId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);
                Usuario usuario = usuarioComId(usuarioId);

                CriarTransacaoRequest requisicao = new CriarTransacaoRequest(
                                "Conta",
                                new BigDecimal("100.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.DESPESA,
                                new CategoriaTransacaoRequest(null, "Casa"),
                                metaId.toString());

                when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));

                assertThrows(IllegalArgumentException.class, () -> transacaoService.criar(autenticacao, requisicao));
        }

        @Test
        @DisplayName("deve reverter valor poupado ao excluir receita vinculada")
        void deveReverterValorPoupadoAoExcluirReceitaVinculada() {
                UUID usuarioId = UUID.randomUUID();
                UUID transacaoId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);
                Usuario usuario = usuarioComId(usuarioId);
                Categoria categoria = categoriaComId("Trabalho", usuario);
                Meta meta = metaComId("Viagem", new BigDecimal("5000.00"), new BigDecimal("1200.00"), usuario);
                Transacao transacao = new Transacao(
                                "Freelance",
                                new BigDecimal("200.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.RECEITA,
                                categoria,
                                usuario,
                                meta);
                ReflectionTestUtils.setField(transacao, "id", transacaoId);

                when(transacaoRepository.findById(transacaoId)).thenReturn(Optional.of(transacao));

                transacaoService.excluir(autenticacao, transacaoId);

                assertEquals(new BigDecimal("1000.00"), meta.getValorPoupado());
                verify(metaRepository).save(meta);
        }

        @Test
        @DisplayName("deve reverter valor poupado ao atualizar receita vinculada para despesa")
        void deveReverterValorPoupadoAoAtualizarReceitaVinculadaParaDespesa() {
                UUID usuarioId = UUID.randomUUID();
                UUID transacaoId = UUID.randomUUID();
                Authentication autenticacao = autenticacao(usuarioId);

                Usuario usuario = usuarioComId(usuarioId);
                Categoria categoriaAnterior = categoriaComId("Trabalho", usuario);
                Categoria categoriaNova = categoriaComId("Moradia", usuario);
                Meta meta = metaComId("Viagem", new BigDecimal("5000.00"), new BigDecimal("1200.00"), usuario);

                Transacao transacao = new Transacao(
                                "Freelance",
                                new BigDecimal("200.00"),
                                LocalDate.of(2026, 3, 20),
                                TipoTransacao.RECEITA,
                                categoriaAnterior,
                                usuario,
                                meta);
                ReflectionTestUtils.setField(transacao, "id", transacaoId);

                AtualizarTransacaoRequest requisicao = new AtualizarTransacaoRequest(
                                "Conta de luz",
                                new BigDecimal("150.00"),
                                LocalDate.of(2026, 3, 21),
                                TipoTransacao.DESPESA,
                                new CategoriaTransacaoRequest(categoriaNova.getId().toString(), null),
                                null);

                TransacaoResponse respostaEsperada = new TransacaoResponse(
                                transacaoId.toString(),
                                "Conta de luz",
                                new BigDecimal("150.00"),
                                LocalDate.of(2026, 3, 21),
                                TipoTransacao.DESPESA,
                                "Moradia",
                                null);

                when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
                when(transacaoRepository.findById(transacaoId)).thenReturn(Optional.of(transacao));
                when(categoriaRepository.findByIdAndUsuarioId(categoriaNova.getId(), usuarioId))
                                .thenReturn(Optional.of(categoriaNova));
                when(transacaoMapper.paraResponse(transacao)).thenReturn(respostaEsperada);

                TransacaoResponse resposta = transacaoService.atualizar(autenticacao, transacaoId, requisicao);

                assertEquals(respostaEsperada, resposta);
                assertEquals(new BigDecimal("1000.00"), meta.getValorPoupado());
                verify(metaRepository).save(meta);
                assertEquals(TipoTransacao.DESPESA, transacao.getTipo());
                assertEquals(categoriaNova, transacao.getCategoria());
                assertEquals(null, transacao.getMeta());
        }

        private Authentication autenticacao(UUID usuarioId) {
                return UsernamePasswordAuthenticationToken.authenticated(usuarioId.toString(), null,
                                Collections.emptyList());
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

        private Meta metaComId(String nome, BigDecimal valorAlvo, BigDecimal valorPoupado, Usuario usuario) {
                Meta meta = new Meta(nome, valorAlvo, usuario);
                ReflectionTestUtils.setField(meta, "id", UUID.randomUUID());
                ReflectionTestUtils.setField(meta, "valorPoupado", valorPoupado);
                return meta;
        }
}
