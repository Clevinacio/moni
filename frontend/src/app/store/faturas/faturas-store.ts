import { Injectable, computed, signal } from '@angular/core';
import { Fatura } from '../../models/fatura.models';

@Injectable({
  providedIn: 'root',
})
export class FaturasStore {
  readonly faturas = signal<Fatura[]>([]);
  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);

  readonly totalFaturas = computed(() => this.faturas().length);
  readonly faturasPagas = computed(() => this.faturas().filter((f) => f.paga));
  readonly faturasNaoPagas = computed(() => this.faturas().filter((f) => !f.paga));
  readonly valorTotalNaoPago = computed(() => 
    this.faturasNaoPagas().reduce((acc, f) => acc + f.valor, 0)
  );

  definirFaturas(lista: Fatura[]): void {
    this.faturas.set(lista);
  }

  adicionarFatura(fatura: Fatura): void {
    this.faturas.update((atuais) => [...atuais, fatura]);
  }

  atualizarFatura(faturaAtualizada: Fatura): void {
    this.faturas.update((atuais) =>
      atuais.map((f) => (f.id === faturaAtualizada.id ? faturaAtualizada : f))
    );
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
}
