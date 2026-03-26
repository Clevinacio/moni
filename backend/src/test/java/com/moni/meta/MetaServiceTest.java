package com.moni.meta;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.moni.configuration.exception.MetaNaoEncontradaException;
import com.moni.dto.AtualizarMetaRequest;
import com.moni.dto.CriarMetaRequest;
import com.moni.dto.MetaResponse;
import com.moni.entity.Meta;
import com.moni.entity.MetaRepository;
import com.moni.entity.Usuario;
import com.moni.entity.UsuarioRepository;
import com.moni.mapper.MetaMapper;
import com.moni.service.MetaService;
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
class MetaServiceTest {

    @Mock
    private MetaRepository metaRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private MetaMapper metaMapper;

    private MetaService metaService;

    @BeforeEach
    void setUp() {
        metaService = new MetaService(metaRepository, usuarioRepository, metaMapper);
    }

    @Test
    @DisplayName("deve criar meta com sucesso")
    void deveCriarMetaComSucesso() {
        UUID usuarioId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);
        Usuario usuario = usuarioComId(usuarioId);
        Meta meta = metaComId("Reserva", new BigDecimal("5000.00"), new BigDecimal("0.00"), usuario);

        CriarMetaRequest requisicao = new CriarMetaRequest("Reserva", new BigDecimal("5000.00"));
        MetaResponse respostaEsperada = new MetaResponse(
                meta.getId().toString(),
                meta.getNome(),
                meta.getValorAlvo(),
                meta.getValorPoupado());

        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(metaRepository.findByUsuarioIdAndNomeIgnoreCase(usuarioId, "Reserva")).thenReturn(Optional.empty());
        when(metaRepository.save(org.mockito.ArgumentMatchers.any(Meta.class))).thenReturn(meta);
        when(metaMapper.paraResponse(meta)).thenReturn(respostaEsperada);

        MetaResponse resposta = metaService.criar(autenticacao, requisicao);

        assertEquals(respostaEsperada, resposta);
    }

    @Test
    @DisplayName("deve listar metas do usuario autenticado")
    void deveListarMetasDoUsuarioAutenticado() {
        UUID usuarioId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);
        Usuario usuario = usuarioComId(usuarioId);
        Meta meta = metaComId("Viagem", new BigDecimal("10000.00"), new BigDecimal("1200.00"), usuario);

        MetaResponse respostaEsperada = new MetaResponse(
                meta.getId().toString(),
                meta.getNome(),
                meta.getValorAlvo(),
                meta.getValorPoupado());

        when(metaRepository.findByUsuarioIdOrderByNomeAsc(usuarioId)).thenReturn(List.of(meta));
        when(metaMapper.paraResponses(List.of(meta))).thenReturn(List.of(respostaEsperada));

        List<MetaResponse> resposta = metaService.listar(autenticacao);

        assertEquals(1, resposta.size());
        assertEquals(respostaEsperada, resposta.get(0));
    }

    @Test
    @DisplayName("deve atualizar meta existente")
    void deveAtualizarMetaExistente() {
        UUID usuarioId = UUID.randomUUID();
        UUID metaId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);
        Usuario usuario = usuarioComId(usuarioId);
        Meta meta = metaComId("Casa", new BigDecimal("50000.00"), new BigDecimal("2000.00"), usuario);
        ReflectionTestUtils.setField(meta, "id", metaId);

        AtualizarMetaRequest requisicao = new AtualizarMetaRequest("Casa Nova", new BigDecimal("70000.00"));
        MetaResponse respostaEsperada = new MetaResponse(
                metaId.toString(),
                "Casa Nova",
                new BigDecimal("70000.00"),
                new BigDecimal("2000.00"));

        when(metaRepository.findByIdAndUsuarioId(metaId, usuarioId)).thenReturn(Optional.of(meta));
        when(metaMapper.paraResponse(meta)).thenReturn(respostaEsperada);

        MetaResponse resposta = metaService.atualizar(autenticacao, metaId, requisicao);

        assertEquals(respostaEsperada, resposta);
    }

    @Test
    @DisplayName("deve falhar ao buscar meta inexistente")
    void deveFalharAoBuscarMetaInexistente() {
        UUID usuarioId = UUID.randomUUID();
        UUID metaId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);

        when(metaRepository.findByIdAndUsuarioId(metaId, usuarioId)).thenReturn(Optional.empty());

        assertThrows(MetaNaoEncontradaException.class, () -> metaService.obter(autenticacao, metaId));
    }

    private Authentication autenticacao(UUID usuarioId) {
        return UsernamePasswordAuthenticationToken.authenticated(usuarioId.toString(), null, List.of());
    }

    private Usuario usuarioComId(UUID usuarioId) {
        Usuario usuario = new Usuario("Usuario Teste", "usuario@moni.com", "hash");
        ReflectionTestUtils.setField(usuario, "id", usuarioId);
        return usuario;
    }

    private Meta metaComId(String nome, BigDecimal valorAlvo, BigDecimal valorPoupado, Usuario usuario) {
        Meta meta = new Meta(nome, valorAlvo, usuario);
        ReflectionTestUtils.setField(meta, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(meta, "valorPoupado", valorPoupado);
        return meta;
    }
}
