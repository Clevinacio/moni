import { Injectable, computed, inject, signal } from '@angular/core';

import { SessaoAutenticacao } from '../../models/sessao.models';
import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly sessaoStorage = inject(SessaoAutenticacaoStorage);

  readonly sessao = signal<SessaoAutenticacao | null>(this.sessaoStorage.carregar());
  readonly autenticado = computed(() => this.sessao() !== null);
  readonly descricaoSessao = computed(
    () => this.sessao()?.email ?? this.sessao()?.userId ?? this.sessao()?.nome ?? 'usuario',
  );

  definirSessao(sessao: SessaoAutenticacao): void {
    this.sessaoStorage.salvar(sessao);
    this.sessao.set(sessao);
  }

  limparSessao(): void {
    this.sessaoStorage.limpar();
    this.sessao.set(null);
  }
}
