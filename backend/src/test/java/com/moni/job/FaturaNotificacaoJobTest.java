package com.moni.job;

import com.moni.entity.Fatura;
import com.moni.entity.FaturaRepository;
import com.moni.entity.Usuario;
import com.moni.service.NotificacaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.eq;

@ExtendWith(MockitoExtension.class)
class FaturaNotificacaoJobTest {

    @Mock
    private FaturaRepository faturaRepository;

    @Mock
    private NotificacaoService notificacaoService;

    @InjectMocks
    private FaturaNotificacaoJob faturaNotificacaoJob;

    private Usuario usuario;

    @BeforeEach
    void setUp() {
        usuario = new Usuario("Usuario Teste", "teste@exemplo.com", "senha");
        org.springframework.test.util.ReflectionTestUtils.setField(usuario, "id", UUID.randomUUID());
    }

    @Test
    @DisplayName("Deve gerar notificacoes corretas para faturas proximo ao vencimento, no vencimento e atrasadas")
    void deveGerarNotificacoesCorretamente() {
        LocalDate hoje = LocalDate.now();

        Fatura faturaVenceEm5Dias = novaFatura("Fatura 5 Dias", hoje.plusDays(5));
        Fatura faturaVenceHoje = novaFatura("Fatura Hoje", hoje);
        Fatura faturaAtrasada = novaFatura("Fatura Atrasada", hoje.minusDays(2));
        Fatura faturaPaga = novaFatura("Fatura Paga", hoje.minusDays(2));
        faturaPaga.setPaga(true);
        Fatura faturaSegura = novaFatura("Fatura Segura", hoje.plusDays(10));

        when(faturaRepository.findAll()).thenReturn(List.of(
                faturaVenceEm5Dias, faturaVenceHoje, faturaAtrasada, faturaPaga, faturaSegura
        ));

        faturaNotificacaoJob.verificarFaturasEGerarNotificacoes();

        verify(notificacaoService, times(1)).notificarFatura(eq(faturaVenceEm5Dias), eq("Sua fatura \"Fatura 5 Dias\" vence em 5 dias."));
        verify(notificacaoService, times(1)).notificarFatura(eq(faturaVenceHoje), eq("Sua fatura \"Fatura Hoje\" vence HOJE."));
        verify(notificacaoService, times(1)).notificarFatura(eq(faturaAtrasada), eq("Sua fatura \"Fatura Atrasada\" esta atrasada há 2 dias."));
        
        // As outras não devem gerar notificações
        verify(notificacaoService, times(0)).notificarFatura(eq(faturaPaga), any());
        verify(notificacaoService, times(0)).notificarFatura(eq(faturaSegura), any());
    }

    private Fatura novaFatura(String descricao, LocalDate dataVencimento) {
        Fatura fatura = new Fatura();
        fatura.setId(UUID.randomUUID());
        fatura.setDescricao(descricao);
        fatura.setDataVencimento(dataVencimento);
        fatura.setUsuario(usuario);
        fatura.setPaga(false);
        return fatura;
    }
}
