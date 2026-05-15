package com.moni.job;

import com.moni.entity.Fatura;
import com.moni.entity.FaturaRepository;
import com.moni.service.NotificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class FaturaNotificacaoJob {

    private final FaturaRepository faturaRepository;
    private final NotificacaoService notificacaoService;

    @Scheduled(cron = "0 0 8 * * *") // Roda todos os dias às 8h da manhã
    public void verificarFaturasEGerarNotificacoes() {
        LocalDate hoje = LocalDate.now();
        List<Fatura> faturasNaoPagas = faturaRepository.findAll().stream()
                .filter(f -> !f.isPaga())
                .toList();

        for (Fatura fatura : faturasNaoPagas) {
            if (fatura.getDataVencimento().isEqual(hoje.plusDays(5))) {
                notificacaoService.notificarFatura(fatura, "Sua fatura \"" + fatura.getDescricao() + "\" vence em 5 dias.");
            } else if (fatura.getDataVencimento().isEqual(hoje)) {
                notificacaoService.notificarFatura(fatura, "Sua fatura \"" + fatura.getDescricao() + "\" vence HOJE.");
            } else if (fatura.getDataVencimento().isBefore(hoje)) {
                long diasAtraso = hoje.toEpochDay() - fatura.getDataVencimento().toEpochDay();
                notificacaoService.notificarFatura(fatura, "Sua fatura \"" + fatura.getDescricao() + "\" esta atrasada há " + diasAtraso + " dias.");
            }
        }
    }
}
