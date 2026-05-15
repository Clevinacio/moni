import { TestBed } from '@angular/core/testing';
import { FaturasStore } from './faturas-store';
import { Fatura } from '../../models/fatura.models';

describe('FaturasStore', () => {
  let store: FaturasStore;

  const faturaPendente: Fatura = {
    id: '1',
    descricao: 'Conta Luz',
    valor: 100,
    dataVencimento: '2026-05-10',
    paga: false
  };

  const faturaPaga: Fatura = {
    id: '2',
    descricao: 'Conta Agua',
    valor: 50,
    dataVencimento: '2026-05-05',
    paga: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FaturasStore]
    });
    store = TestBed.inject(FaturasStore);
  });

  it('deve inicializar com estado vazio', () => {
    expect(store.faturas()).toEqual([]);
    expect(store.carregando()).toBe(false);
    expect(store.mensagemErro()).toBeNull();
    expect(store.mensagemSucesso()).toBeNull();
  });

  it('deve definir a lista de faturas', () => {
    store.definirFaturas([faturaPendente, faturaPaga]);
    expect(store.faturas().length).toBe(2);
    expect(store.faturasPagas().length).toBe(1);
    expect(store.faturasNaoPagas().length).toBe(1);
    expect(store.valorTotalNaoPago()).toBe(100);
  });

  it('deve adicionar uma fatura', () => {
    store.adicionarFatura(faturaPendente);
    expect(store.faturas().length).toBe(1);
    expect(store.faturas()[0]).toEqual(faturaPendente);
  });

  it('deve atualizar uma fatura existente', () => {
    store.definirFaturas([faturaPendente]);
    const atualizada = { ...faturaPendente, paga: true };
    
    store.atualizarFatura(atualizada);
    
    expect(store.faturas()[0].paga).toBe(true);
    expect(store.faturasNaoPagas().length).toBe(0);
    expect(store.faturasPagas().length).toBe(1);
  });

  it('deve definir o estado de carregamento', () => {
    store.definirCarregando(true);
    expect(store.carregando()).toBe(true);
  });

  it('deve definir mensagens de erro e sucesso', () => {
    store.definirErro('Erro ao carregar');
    expect(store.mensagemErro()).toBe('Erro ao carregar');

    store.definirSucesso('Sucesso');
    expect(store.mensagemSucesso()).toBe('Sucesso');
  });
});
