package com.moni.service;

import com.moni.entity.Meta;
import com.moni.entity.Notificacao;
import com.moni.entity.NotificacaoRepository;
import com.moni.entity.TipoNotificacao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;

    @Transactional
    public void notificarMetaAtingida(Meta meta) {
        String mensagem = "Parabens! A meta \"" + meta.getNome() + "\" foi atingida.";
        Notificacao notificacao = new Notificacao(mensagem, TipoNotificacao.META_ATINGIDA, meta.getUsuario());
        notificacaoRepository.save(notificacao);
    }
}
