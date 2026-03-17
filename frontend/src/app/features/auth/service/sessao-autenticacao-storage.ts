import { Injectable } from '@angular/core';

import { SessaoAutenticacao } from '../../../models/sessao.models';

@Injectable({
  providedIn: 'root',
})
export class SessaoAutenticacaoStorage {
  private readonly chaveStorage = 'moni.auth';

  salvar(sessao: SessaoAutenticacao): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.chaveStorage, JSON.stringify(sessao));
  }

  carregar(): SessaoAutenticacao | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const sessaoBruta = localStorage.getItem(this.chaveStorage);

    if (!sessaoBruta) {
      return null;
    }

    try {
      const sessaoLida = JSON.parse(sessaoBruta) as unknown;

      if (!ehRegistro(sessaoLida)) {
        return null;
      }

      if (typeof sessaoLida['token'] !== 'string' || sessaoLida['token'].trim().length === 0) {
        return null;
      }

      const sessao: SessaoAutenticacao = {
        token: sessaoLida['token'],
        userId: typeof sessaoLida['userId'] === 'string' ? sessaoLida['userId'] : undefined,
        nome: typeof sessaoLida['nome'] === 'string' ? sessaoLida['nome'] : undefined,
        email: typeof sessaoLida['email'] === 'string' ? sessaoLida['email'] : undefined,
      };

      return sessao;
    } catch {
      return null;
    }
  }

  limpar(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.chaveStorage);
  }
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}
