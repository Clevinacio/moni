import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Bell, DoorOpen, LogOut, LucideAngularModule, Moon, Sun } from 'lucide-angular';

import { AuthStore } from '../../../store/auth/auth-store';
import { PreferenciaUiStore } from '../../../store/preferencia-ui/preferencia-ui-store';

type ItemNavegacao = Readonly<{
  titulo: string;
  subtitulo: string;
  rota?: string;
}>;

@Component({
  selector: 'app-shell-autenticado',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './shell-autenticado.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class ShellAutenticadoComponent {
  private readonly authStore = inject(AuthStore);
  private readonly roteador = inject(Router);
  private readonly preferenciaUiStore = inject(PreferenciaUiStore);

  readonly iconeNotificacao = Bell;
  readonly iconeSair = LogOut;
  readonly iconePorta = DoorOpen;
  readonly iconeLua = Moon;
  readonly iconeSol = Sun;
  readonly temaEscuroAtivo = this.preferenciaUiStore.temaEscuroAtivo;
  readonly rotuloAlternadorTema = this.preferenciaUiStore.temaAtualDescricao;

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

  sair(): void {
    this.authStore.limparSessao();
    this.roteador.navigate(['/auth/login']);
  }

  alternarTema(): void {
    this.preferenciaUiStore.alternarTema();
  }
}