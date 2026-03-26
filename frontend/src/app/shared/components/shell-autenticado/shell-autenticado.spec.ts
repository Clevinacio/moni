import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ServicoNotificacoesTempoReal } from '../../../features/notificacoes/service/servico-notificacoes-tempo-real';
import { ServicoNotificacoes } from '../../../features/notificacoes/service/servico-notificacoes';
import { AuthStore } from '../../../store/auth/auth-store';
import { PreferenciaUiStore } from '../../../store/preferencia-ui/preferencia-ui-store';
import { ShellAutenticadoComponent } from './shell-autenticado';

describe('ShellAutenticadoComponent - RF07', () => {
  it('deve abrir painel de notificacoes ao clicar no sino', () => {
    const mockServicoNotificacoes = {
      listar: vi.fn().mockReturnValue(of([])),
      limpar: vi.fn().mockReturnValue(of(void 0)),
    };
    const mockServicoNotificacoesTempoReal = {
      conectar: vi.fn(),
      desconectar: vi.fn(),
      notificacoes$: of(),
    };

    const mockAuthStore = {
      sessao: signal({
        token: 'token-teste',
        nome: 'Ana',
        email: 'ana@moni.com',
        userId: 'usr-01',
      }),
      limparSessao: vi.fn(),
    };

    const temaEscuroAtivo = signal(false);
    const mockPreferenciaUiStore = {
      temaEscuroAtivo,
      temaAtualDescricao: computed(() => 'Ativar modo escuro'),
      alternarTema: vi.fn(() => temaEscuroAtivo.set(!temaEscuroAtivo())),
    };

    TestBed.configureTestingModule({
      imports: [ShellAutenticadoComponent, RouterTestingModule],
      providers: [
        { provide: ServicoNotificacoes, useValue: mockServicoNotificacoes },
        { provide: ServicoNotificacoesTempoReal, useValue: mockServicoNotificacoesTempoReal },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: PreferenciaUiStore, useValue: mockPreferenciaUiStore },
      ],
    });

    const fixture = TestBed.createComponent(ShellAutenticadoComponent);
    fixture.detectChanges();

    const botoesNotificacao = fixture.nativeElement.querySelectorAll('button[aria-label="Notificações"]');
    const botaoNotificacaoDesktop = botoesNotificacao[0] as HTMLButtonElement;

    botaoNotificacaoDesktop.click();
    fixture.detectChanges();

    expect(mockServicoNotificacoesTempoReal.conectar).toHaveBeenCalledWith('token-teste');

    const painel = fixture.nativeElement.querySelector('#painel-notificacoes');
    expect(painel).toBeTruthy();
  });

  it('deve acionar limpar notificacoes ao clicar no botao Limpar', () => {
    const mockServicoNotificacoes = {
      listar: vi.fn().mockReturnValue(
        of([
          {
            id: 'notif-01',
            mensagem: 'Meta concluida',
            tipo: 'META_ATINGIDA',
            lida: false,
            criadaEm: '2026-03-26T11:20:00Z',
          },
        ]),
      ),
      limpar: vi.fn().mockReturnValue(of(void 0)),
    };
    const mockServicoNotificacoesTempoReal = {
      conectar: vi.fn(),
      desconectar: vi.fn(),
      notificacoes$: of(),
    };

    const mockAuthStore = {
      sessao: signal({
        token: 'token-teste',
        nome: 'Ana',
        email: 'ana@moni.com',
        userId: 'usr-01',
      }),
      limparSessao: vi.fn(),
    };

    const temaEscuroAtivo = signal(false);
    const mockPreferenciaUiStore = {
      temaEscuroAtivo,
      temaAtualDescricao: computed(() => 'Ativar modo escuro'),
      alternarTema: vi.fn(() => temaEscuroAtivo.set(!temaEscuroAtivo())),
    };

    TestBed.configureTestingModule({
      imports: [ShellAutenticadoComponent, RouterTestingModule],
      providers: [
        { provide: ServicoNotificacoes, useValue: mockServicoNotificacoes },
        { provide: ServicoNotificacoesTempoReal, useValue: mockServicoNotificacoesTempoReal },
        { provide: AuthStore, useValue: mockAuthStore },
        { provide: PreferenciaUiStore, useValue: mockPreferenciaUiStore },
      ],
    });

    const fixture = TestBed.createComponent(ShellAutenticadoComponent);
    fixture.detectChanges();

    const botoesNotificacao = fixture.nativeElement.querySelectorAll('button[aria-label="Notificações"]');
    const botaoNotificacaoDesktop = botoesNotificacao[0] as HTMLButtonElement;

    botaoNotificacaoDesktop.click();
    fixture.detectChanges();

    const botoes = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    );
    const botaoLimpar = botoes.find((elemento) => elemento.textContent?.trim() === 'Limpar');

    expect(botaoLimpar).toBeTruthy();

    (botaoLimpar as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(mockServicoNotificacoes.limpar).toHaveBeenCalledTimes(1);
  });
});