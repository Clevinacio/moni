import { TestBed } from '@angular/core/testing';

import { NotificacoesStore } from './notificacoes-store';

describe('NotificacoesStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('deve calcular total de nao lidas', () => {
    const store = TestBed.inject(NotificacoesStore);

    store.definirNotificacoes([
      {
        id: 'notif-01',
        mensagem: 'Meta A',
        tipo: 'META_ATINGIDA',
        lida: false,
        criadaEm: '2026-03-26T10:00:00Z',
      },
      {
        id: 'notif-02',
        mensagem: 'Meta B',
        tipo: 'META_ATINGIDA',
        lida: true,
        criadaEm: '2026-03-26T11:00:00Z',
      },
    ]);

    expect(store.totalNaoLidas()).toBe(1);
  });

  it('deve abrir e fechar painel de notificacoes', () => {
    const store = TestBed.inject(NotificacoesStore);

    store.definirPainelAberto(true);
    expect(store.painelAberto()).toBe(true);

    store.definirPainelAberto(false);
    expect(store.painelAberto()).toBe(false);
  });

  it('deve limpar notificacoes ao definir lista vazia', () => {
    const store = TestBed.inject(NotificacoesStore);

    store.definirNotificacoes([
      {
        id: 'notif-01',
        mensagem: 'Meta A',
        tipo: 'META_ATINGIDA',
        lida: false,
        criadaEm: '2026-03-26T10:00:00Z',
      },
    ]);
    expect(store.notificacoes().length).toBe(1);

    store.definirNotificacoes([]);
    expect(store.notificacoes().length).toBe(0);
    expect(store.totalNaoLidas()).toBe(0);
  });
});