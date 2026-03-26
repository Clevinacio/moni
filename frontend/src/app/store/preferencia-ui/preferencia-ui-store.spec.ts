import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { PreferenciaUiStore } from './preferencia-ui-store';

describe('PreferenciaUiStore', () => {
  const chaveTemaEscuro = 'moni.ui.theme.dark';

  beforeEach(() => {
    localStorage.removeItem(chaveTemaEscuro);

    TestBed.configureTestingModule({});
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.removeItem(chaveTemaEscuro);
    document.documentElement.classList.remove('dark');
  });

  it('deve inicializar com tema salvo em storage', () => {
    localStorage.setItem(chaveTemaEscuro, 'true');
    const store = TestBed.inject(PreferenciaUiStore);

    store.inicializarTema();

    expect(store.temaEscuroAtivo()).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('deve alternar tema e persistir preferencia', () => {
    const store = TestBed.inject(PreferenciaUiStore);

    store.inicializarTema();
    store.alternarTema();

    expect(store.temaEscuroAtivo()).toBe(true);
    expect(localStorage.getItem(chaveTemaEscuro)).toBe('true');

    store.alternarTema();

    expect(store.temaEscuroAtivo()).toBe(false);
    expect(localStorage.getItem(chaveTemaEscuro)).toBe('false');
  });

  it('deve seguir preferencia do sistema quando nao houver valor salvo', () => {
    const matchMediaOriginal = window.matchMedia;
    const matchMediaMock = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    } as unknown as MediaQueryList);

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });

    const store = TestBed.inject(PreferenciaUiStore);

    store.inicializarTema();

    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(store.temaEscuroAtivo()).toBe(true);

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaOriginal,
    });
  });
});
