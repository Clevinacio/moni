import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Bell, DoorOpen, LogOut, LucideAngularModule, Moon, Sun, Trash2, X } from 'lucide-angular';
import { finalize, interval } from 'rxjs';

import { ServicoNotificacoesTempoReal } from '../../../features/notificacoes/service/servico-notificacoes-tempo-real';
import { ServicoNotificacoes } from '../../../features/notificacoes/service/servico-notificacoes';
import { NotificacoesStore } from '../../../store/notificacoes/notificacoes-store';
import { AuthStore } from '../../../store/auth/auth-store';
import { PreferenciaUiStore } from '../../../store/preferencia-ui/preferencia-ui-store';
import { extrairMensagemErroTransacao } from '../../utils/mensagem-erro-transacao';

type ItemNavegacao = Readonly<{
  titulo: string;
  subtitulo: string;
  rota?: string;
}>;

@Component({
  selector: 'app-shell-autenticado',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, DatePipe],
  templateUrl: './shell-autenticado.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class ShellAutenticadoComponent {
  private readonly authStore = inject(AuthStore);
  private readonly roteador = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly preferenciaUiStore = inject(PreferenciaUiStore);
  private readonly servicoNotificacoes = inject(ServicoNotificacoes);
  private readonly servicoNotificacoesTempoReal = inject(ServicoNotificacoesTempoReal);
  private readonly notificacoesStore = inject(NotificacoesStore);

  readonly iconeNotificacao = Bell;
  readonly iconeLimparNotificacoes = Trash2;
  readonly iconeFecharNotificacoes = X;
  readonly iconeSair = LogOut;
  readonly iconePorta = DoorOpen;
  readonly iconeLua = Moon;
  readonly iconeSol = Sun;
  readonly temaEscuroAtivo = this.preferenciaUiStore.temaEscuroAtivo;
  readonly rotuloAlternadorTema = this.preferenciaUiStore.temaAtualDescricao;
  readonly notificacoes = this.notificacoesStore.notificacoes;
  readonly painelNotificacoesAberto = this.notificacoesStore.painelAberto;
  readonly carregandoNotificacoes = this.notificacoesStore.carregando;
  readonly mensagemErroNotificacoes = this.notificacoesStore.mensagemErro;
  readonly mensagemSucessoNotificacoes = this.notificacoesStore.mensagemSucesso;
  readonly totalNotificacoesNaoLidas = this.notificacoesStore.totalNaoLidas;
  readonly temNotificacoes = computed(() => this.notificacoes().length > 0);
  readonly temMensagemErroNotificacoes = computed(() => this.mensagemErroNotificacoes() !== null);
  readonly temMensagemSucessoNotificacoes = computed(() => this.mensagemSucessoNotificacoes() !== null);

  readonly navegacaoLateral: readonly ItemNavegacao[] = [
    {
      titulo: 'Painel',
      subtitulo: 'Dashboard',
      rota: '/painel',
    },
    {
      titulo: 'Transações',
      subtitulo: 'Lançamentos',
      rota: '/transacoes',
    },
    {
      titulo: 'Metas',
      subtitulo: 'Objetivos',
      rota: '/metas',
    },
    {
      titulo: 'Faturas',
      subtitulo: 'Em breve',
    },
  ];

  readonly navegacaoMobile: readonly ItemNavegacao[] = [
    {
      titulo: 'Painel',
      subtitulo: 'Dashboard',
      rota: '/painel',
    },
    {
      titulo: 'Transações',
      subtitulo: 'Lançamentos',
      rota: '/transacoes',
    },
    {
      titulo: 'Metas',
      subtitulo: 'Objetivos',
      rota: '/metas',
    },
    {
      titulo: 'Faturas',
      subtitulo: 'Em breve',
    },
  ];

  readonly saudacao = computed(() => {
    const sessao = this.authStore.sessao();
    const nomeSessao = sessao?.nome?.trim() ?? '';
    const nomeEmail = sessao?.email?.split('@')[0]?.trim() ?? '';
    const nomeLimpo = nomeSessao || nomeEmail;

    if (!nomeLimpo) {
      return 'Olá, usuário!';
    }

    return `Olá, ${nomeLimpo.charAt(0).toUpperCase()}${nomeLimpo.slice(1)}!`;
  });

  constructor() {
    this.carregarNotificacoes(true);
    this.iniciarEscutaNotificacoesTempoReal();
    this.iniciarAtualizacaoAutomaticaNotificacoes();
  }

  sair(): void {
    this.servicoNotificacoesTempoReal.desconectar();
    this.authStore.limparSessao();
    this.roteador.navigate(['/auth/login']);
  }

  alternarTema(): void {
    this.preferenciaUiStore.alternarTema();
  }

  alternarPainelNotificacoes(): void {
    const aberto = this.painelNotificacoesAberto();
    this.notificacoesStore.definirPainelAberto(!aberto);

    if (!aberto && this.notificacoes().length === 0) {
      this.carregarNotificacoes(true);
    }
  }

  fecharPainelNotificacoes(): void {
    this.notificacoesStore.definirPainelAberto(false);
  }

  limparNotificacoes(): void {
    this.notificacoesStore.definirCarregando(true);
    this.notificacoesStore.definirErro(null);
    this.notificacoesStore.definirSucesso(null);

    this.servicoNotificacoes
      .limpar()
      .pipe(finalize(() => this.notificacoesStore.definirCarregando(false)))
      .subscribe({
        next: () => {
          this.notificacoesStore.definirNotificacoes([]);
          this.notificacoesStore.definirSucesso('Notificações removidas com sucesso.');
        },
        error: (erro: unknown) => {
          this.notificacoesStore.definirErro(
            extrairMensagemErroTransacao(erro, 'Não foi possível limpar as notificações.'),
          );
        },
      });
  }

  private iniciarAtualizacaoAutomaticaNotificacoes(): void {
    interval(10000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.carregarNotificacoes(false));
  }

  private iniciarEscutaNotificacoesTempoReal(): void {
    const token = this.authStore.sessao()?.token;

    if (!token) {
      return;
    }

    this.servicoNotificacoesTempoReal.conectar(token);

    this.servicoNotificacoesTempoReal.notificacoes$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notificacao) => {
        this.notificacoesStore.definirErro(null);
        this.notificacoesStore.adicionarNotificacaoEmTempoReal(notificacao);
      });
  }

  private carregarNotificacoes(exibirCarregamento: boolean): void {
    if (exibirCarregamento) {
      this.notificacoesStore.definirCarregando(true);
    }

    this.notificacoesStore.definirErro(null);

    this.servicoNotificacoes
      .listar()
      .pipe(
        finalize(() => {
          if (exibirCarregamento) {
            this.notificacoesStore.definirCarregando(false);
          }
        }),
      )
      .subscribe({
        next: (lista) => {
          this.notificacoesStore.definirNotificacoes(lista);
        },
        error: (erro: unknown) => {
          this.notificacoesStore.definirErro(
            extrairMensagemErroTransacao(erro, 'Não foi possível carregar as notificações.'),
          );
        },
      });
  }
}