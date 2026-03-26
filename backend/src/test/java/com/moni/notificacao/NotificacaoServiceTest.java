package com.moni.notificacao;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.dto.NotificacaoResponse;
import com.moni.entity.Notificacao;
import com.moni.entity.NotificacaoRepository;
import com.moni.entity.TipoNotificacao;
import com.moni.entity.Usuario;
import com.moni.service.NotificacaoService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
class NotificacaoServiceTest {

    @Mock
    private NotificacaoRepository notificacaoRepository;
    @Mock
    private SimpMessagingTemplate mensageria;

    private NotificacaoService notificacaoService;

    @BeforeEach
    void setUp() {
        notificacaoService = new NotificacaoService(notificacaoRepository, mensageria);
    }

    @Test
    @DisplayName("deve listar notificacoes do usuario autenticado ordenadas por criadaEm desc")
    void deveListarNotificacoesDoUsuarioAutenticado() {
        UUID usuarioId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);
        Usuario usuario = usuarioComId(usuarioId);

        Notificacao maisRecente = notificacaoComDados(
                "Meta Viagem atingida.",
                TipoNotificacao.META_ATINGIDA,
                usuario,
                OffsetDateTime.of(2026, 3, 26, 10, 0, 0, 0, ZoneOffset.UTC));
        Notificacao maisAntiga = notificacaoComDados(
                "Meta Reserva atingida.",
                TipoNotificacao.META_ATINGIDA,
                usuario,
                OffsetDateTime.of(2026, 3, 25, 10, 0, 0, 0, ZoneOffset.UTC));

        when(notificacaoRepository.findByUsuarioIdOrderByCriadaEmDesc(usuarioId))
                .thenReturn(List.of(maisRecente, maisAntiga));

        List<NotificacaoResponse> resposta = notificacaoService.listar(autenticacao);

        assertEquals(2, resposta.size());
        assertEquals("Meta Viagem atingida.", resposta.get(0).mensagem());
        assertEquals("META_ATINGIDA", resposta.get(0).tipo());
        assertEquals("Meta Reserva atingida.", resposta.get(1).mensagem());
    }

    @Test
    @DisplayName("deve limpar notificacoes do usuario autenticado")
    void deveLimparNotificacoesDoUsuarioAutenticado() {
        UUID usuarioId = UUID.randomUUID();
        Authentication autenticacao = autenticacao(usuarioId);

        notificacaoService.limpar(autenticacao);

        verify(notificacaoRepository).deleteByUsuarioId(usuarioId);
    }

    @Test
    @DisplayName("deve falhar ao listar notificacoes sem autenticacao valida")
    void deveFalharAoListarSemAutenticacaoValida() {
        Authentication autenticacaoInvalida = UsernamePasswordAuthenticationToken.unauthenticated("", null);

        assertThrows(CredenciaisInvalidasException.class, () -> notificacaoService.listar(autenticacaoInvalida));
    }

    @Test
    @DisplayName("deve publicar notificacao em tempo real ao notificar meta atingida")
    void devePublicarNotificacaoEmTempoRealAoNotificarMetaAtingida() {
        UUID usuarioId = UUID.randomUUID();
        Usuario usuario = usuarioComId(usuarioId);
        var meta = new com.moni.entity.Meta("Viagem", java.math.BigDecimal.valueOf(5000), usuario);

        Notificacao notificacaoSalva = notificacaoComDados(
                "Parabéns! A meta \"Viagem\" foi atingida.",
                TipoNotificacao.META_ATINGIDA,
                usuario,
                OffsetDateTime.of(2026, 3, 26, 10, 0, 0, 0, ZoneOffset.UTC));

        when(notificacaoRepository.save(org.mockito.ArgumentMatchers.any(Notificacao.class)))
                .thenReturn(notificacaoSalva);

        notificacaoService.notificarMetaAtingida(meta);

        verify(mensageria).convertAndSendToUser(
                org.mockito.ArgumentMatchers.eq(usuarioId.toString()),
                org.mockito.ArgumentMatchers.eq("/queue/notificacoes"),
                org.mockito.ArgumentMatchers.any(NotificacaoResponse.class));
    }

    private Authentication autenticacao(UUID usuarioId) {
        return UsernamePasswordAuthenticationToken.authenticated(usuarioId.toString(), null, List.of());
    }

    private Usuario usuarioComId(UUID usuarioId) {
        Usuario usuario = new Usuario("Usuario Teste", "usuario@moni.com", "hash");
        ReflectionTestUtils.setField(usuario, "id", usuarioId);
        return usuario;
    }

    private Notificacao notificacaoComDados(
            String mensagem,
            TipoNotificacao tipo,
            Usuario usuario,
            OffsetDateTime criadaEm) {
        Notificacao notificacao = new Notificacao(mensagem, tipo, usuario);
        ReflectionTestUtils.setField(notificacao, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(notificacao, "criadaEm", criadaEm);
        return notificacao;
    }
}