import { Injectable, computed, signal } from '@angular/core';

import { FiltrosTransacao, Transacao } from '../../models/transacao.models';

@Injectable({
  providedIn: 'root',
})
export class TransacoesStore {
  readonly transacoes = signal<Transacao[]>([]);
  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);
  readonly transacaoEmEdicaoId = signal<string | null>(null);
  readonly filtroAtivo = signal<FiltrosTransacao | undefined>(undefined);

  readonly totalTransacoes = computed(() => this.transacoes().length);
  readonly emEdicao = computed(() => this.transacaoEmEdicaoId() !== null);
  readonly totalEntradas = computed(() =>
    this.transacoes()
      .filter((transacao) => transacao.tipo === 'RECEITA')
      .reduce((acumulador, transacao) => acumulador + transacao.valor, 0),
  );
  readonly totalDespesas = computed(() =>
    this.transacoes()
      .filter((transacao) => transacao.tipo === 'DESPESA')
      .reduce((acumulador, transacao) => acumulador + transacao.valor, 0),
  );
  readonly totalReceitasDirecionadas = computed(() =>
    this.transacoes()
      .filter((transacao) => transacao.tipo === 'RECEITA' && Boolean(transacao.metaId))
      .reduce((acumulador, transacao) => acumulador + transacao.valor, 0),
  );
  readonly saldoDisponivel = computed(
    () => this.totalEntradas() - (this.totalDespesas() + this.totalReceitasDirecionadas()),
  );

  definirTransacoes(lista: Transacao[]): void {
    this.transacoes.set(lista);
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

  definirEmEdicao(id: string | null): void {
    this.transacaoEmEdicaoId.set(id);
  }

  definirFiltroAtivo(filtro: FiltrosTransacao | undefined): void {
    this.filtroAtivo.set(filtro);
  }
}
