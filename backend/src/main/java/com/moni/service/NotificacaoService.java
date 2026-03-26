package com.moni.service;

import java.util.List;
import java.util.UUID;

import com.moni.configuration.exception.CredenciaisInvalidasException;
import com.moni.dto.NotificacaoResponse;
import com.moni.entity.Meta;
import com.moni.entity.Notificacao;
import com.moni.entity.NotificacaoRepository;
import com.moni.entity.TipoNotificacao;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final SimpMessagingTemplate mensageria;

    @Transactional
    public void notificarMetaAtingida(Meta meta) {
        String mensagem = "Parabéns! A meta \"" + meta.getNome() + "\" foi atingida.";
        Notificacao notificacao = new Notificacao(mensagem, TipoNotificacao.META_ATINGIDA, meta.getUsuario());
        Notificacao notificacaoSalva = notificacaoRepository.save(notificacao);
        NotificacaoResponse resposta = paraResponse(notificacaoSalva);

        mensageria.convertAndSendToUser(meta.getUsuario().getId().toString(), "/queue/notificacoes", resposta);
    }

    @Transactional(readOnly = true)
    public List<NotificacaoResponse> listar(Authentication autenticacao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);

        return notificacaoRepository.findByUsuarioIdOrderByCriadaEmDesc(usuarioId)
                .stream()
                .map(this::paraResponse)
                .toList();
    }

    @Transactional
    public void limpar(Authentication autenticacao) {
        UUID usuarioId = extrairUsuarioId(autenticacao);
        notificacaoRepository.deleteByUsuarioId(usuarioId);
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

    private NotificacaoResponse paraResponse(Notificacao notificacao) {
        return new NotificacaoResponse(
                notificacao.getId().toString(),
                notificacao.getMensagem(),
                notificacao.getTipo().name(),
                notificacao.isLida(),
                notificacao.getCriadaEm());
    }
}
