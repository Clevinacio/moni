import { Injectable, computed, signal } from '@angular/core';

import { Notificacao } from '../../models/notificacao.models';

@Injectable({
  providedIn: 'root',
})
export class NotificacoesStore {
  readonly notificacoes = signal<Notificacao[]>([]);
  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);
  readonly painelAberto = signal(false);

  readonly totalNaoLidas = computed(() =>
    this.notificacoes().filter((notificacao) => notificacao.lida === false).length,
  );

  definirNotificacoes(lista: Notificacao[]): void {
    this.notificacoes.set(lista);
  }

  adicionarNotificacaoEmTempoReal(notificacao: Notificacao): void {
    const listaAtual = this.notificacoes();
    const notificacaoJaExiste = listaAtual.some((item) => item.id === notificacao.id);

    if (notificacaoJaExiste) {
      return;
    }

    this.notificacoes.set([notificacao, ...listaAtual]);
  }

  definirCarregando(carregando: boolean): void {
    this.carregando.set(carregando);
  }

  definirErro(mensagem: string | null): void {
    this.mensagemErro.set(mensagem);
  }

  definirSucesso(mensagem: string | null): void {
    this.mensagemSucesso.set(mensagem);
  }

  definirPainelAberto(aberto: boolean): void {
    this.painelAberto.set(aberto);
  }
}