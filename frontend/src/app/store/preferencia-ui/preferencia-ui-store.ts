import { Injectable, computed, inject, signal } from '@angular/core';

import { PreferenciaUiStorage } from './preferencia-ui-storage';

@Injectable({
  providedIn: 'root',
})
export class PreferenciaUiStore {
  private readonly storage = inject(PreferenciaUiStorage);

  private readonly preferenciaDefinidaManualmente = signal(false);
  readonly temaEscuroAtivo = signal(false);
  readonly temaAtualDescricao = computed(() =>
    this.temaEscuroAtivo() ? 'Ativar modo claro' : 'Ativar modo escuro',
  );

  inicializarTema(): void {
    const preferenciaSalva = this.storage.carregarTemaEscuro();

    if (preferenciaSalva !== null) {
      this.preferenciaDefinidaManualmente.set(true);
      this.definirTemaEscuro(preferenciaSalva, false);
      return;
    }

    this.preferenciaDefinidaManualmente.set(false);
    this.definirTemaEscuro(this.detectarPreferenciaSistema(), false);
  }

  alternarTema(): void {
    this.preferenciaDefinidaManualmente.set(true);
    this.definirTemaEscuro(!this.temaEscuroAtivo(), true);
  }

  sincronizarTemaComSistema(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (evento: MediaQueryListEvent): void => {
      if (!this.preferenciaDefinidaManualmente()) {
        this.definirTemaEscuro(evento.matches, false);
      }
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return;
    }

    const mediaLegado = media as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    if (typeof mediaLegado.addListener === 'function') {
      mediaLegado.addListener(onChange);
    }
  }

  private definirTemaEscuro(ativo: boolean, persistir: boolean): void {
    this.temaEscuroAtivo.set(ativo);
    this.aplicarClasseTema(ativo);

    if (persistir) {
      this.storage.salvarTemaEscuro(ativo);
    }
  }

  private aplicarClasseTema(ativo: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.classList.toggle('dark', ativo);
  }

  private detectarPreferenciaSistema(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
