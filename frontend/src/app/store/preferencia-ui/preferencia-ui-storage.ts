import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PreferenciaUiStorage {
  private readonly chaveTemaEscuro = 'moni.ui.theme.dark';

  salvarTemaEscuro(ativo: boolean): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.chaveTemaEscuro, String(ativo));
  }

  carregarTemaEscuro(): boolean | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const valorLido = localStorage.getItem(this.chaveTemaEscuro);

    if (valorLido === 'true') {
      return true;
    }

    if (valorLido === 'false') {
      return false;
    }

    return null;
  }
}
