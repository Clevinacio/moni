import { Injectable, computed, signal } from '@angular/core';

import { Meta } from '../../models/meta.models';

@Injectable({
  providedIn: 'root',
})
export class MetasStore {
  readonly metas = signal<Meta[]>([]);
  readonly carregando = signal(false);
  readonly mensagemErro = signal<string | null>(null);
  readonly mensagemSucesso = signal<string | null>(null);
  readonly metaEmEdicaoId = signal<string | null>(null);

  readonly totalMetas = computed(() => this.metas().length);
  readonly totalValorPoupado = computed(() =>
    this.metas().reduce((acumulador, meta) => acumulador + meta.valorPoupado, 0),
  );

  definirMetas(lista: Meta[]): void {
    this.metas.set(lista);
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
    this.metaEmEdicaoId.set(id);
  }
}
