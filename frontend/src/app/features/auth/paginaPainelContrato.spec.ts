import { Type, signal, ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { readFile } from 'node:fs/promises';
import { of } from 'rxjs';

import { AuthStore } from '../../store/auth/auth-store';

type Transacao = Readonly<{
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
}>;

const caminhoModuloPainel = './pages/painel/painel';
const caminhoModuloServicoTransacoes = '../transacoes/service/servico-transacoes';
const caminhoModuloServicoMetas = '../metas/service/servico-metas';
const caminhoTemplatePainel = 'src/app/features/auth/pages/painel/painel.html';

function resolverTemplatePainel(url: string): Promise<string> {
  if (url === './painel.html') {
    return readFile(caminhoTemplatePainel, 'utf-8');
  }

  throw new Error(`Contrato do painel nao atendido: recurso de template nao mapeado (${url}).`);
}

describe('RF03 - Contrato visual do painel (TDD)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve expor o componente PaginaPainel no modulo esperado', async () => {
    const tipoPaginaPainel = await carregarClasseContrato(
      caminhoModuloPainel,
      'PaginaPainel',
      'PaginaPainel',
    );

    expect(typeof tipoPaginaPainel).toBe('function');
  });

  it('deve calcular saldo, receitas e despesas a partir das transacoes', async () => {
    const suporte = await criarSuportePaginaPainel([
      {
        id: 't-01',
        descricao: 'Salario',
        valor: 5000,
        data: '2026-03-01',
        tipo: 'RECEITA',
        categoria: 'Renda',
      },
      {
        id: 't-02',
        descricao: 'Supermercado',
        valor: 800,
        data: '2026-03-05',
        tipo: 'DESPESA',
        categoria: 'Alimentacao',
      },
      {
        id: 't-03',
        descricao: 'Aluguel',
        valor: 1200,
        data: '2026-03-10',
        tipo: 'DESPESA',
        categoria: 'Habitacao',
      },
    ]);

    const resumo = suporte.componente.resumoFinanceiro();

    expect(resumo.receitas).toBe(5000);
    expect(resumo.despesas).toBe(2000);
    expect(resumo.saldo).toBe(3000);
  });

  it('deve manter total pendente mock conforme layout aprovado', async () => {
    const suporte = await criarSuportePaginaPainel([]);

    expect(suporte.componente.totalPendente()).toBe(2924.05);
    expect(suporte.componente.contasPendentesMock.length).toBe(3);
  });
});

type SuportePaginaPainel = {
  fixture: ComponentFixture<PaginaPainelContrato>;
  componente: PaginaPainelContrato;
};

type PaginaPainelContrato = {
  resumoFinanceiro: () => { receitas: number; despesas: number; saldo: number };
  totalPendente: () => number;
  contasPendentesMock: readonly unknown[];
};

async function criarSuportePaginaPainel(transacoes: readonly Transacao[]): Promise<SuportePaginaPainel> {
  const tipoPaginaPainel = await carregarClasseContrato(
    caminhoModuloPainel,
    'PaginaPainel',
    'PaginaPainel',
  );
  const tipoServicoTransacoes = await carregarClasseContrato(
    caminhoModuloServicoTransacoes,
    'ServicoTransacoes',
    'ServicoTransacoes',
  );
  const tipoServicoMetas = await carregarClasseContrato(
    caminhoModuloServicoMetas,
    'ServicoMetas',
    'ServicoMetas',
  );

  const stubAuthStore = {
    autenticado: signal(true),
    descricaoSessao: signal('joao@moni.com'),
    limparSessao: (): void => undefined,
  };

  const stubServicoTransacoes = {
    listar: () => of(transacoes),
  };

  const stubServicoMetas = {
    listar: () => of([]),
  };

  await resolveComponentResources(resolverTemplatePainel);

  TestBed.configureTestingModule({
    imports: [tipoPaginaPainel],
    providers: [
      provideRouter([]),
      {
        provide: AuthStore,
        useValue: stubAuthStore,
      },
      {
        provide: tipoServicoTransacoes,
        useValue: stubServicoTransacoes,
      },
      {
        provide: tipoServicoMetas,
        useValue: stubServicoMetas,
      },
    ],
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(tipoPaginaPainel as Type<PaginaPainelContrato>);
  fixture.detectChanges();
  await fixture.whenStable();

  return {
    fixture,
    componente: fixture.componentInstance,
  };
}

async function carregarClasseContrato(
  caminhoModulo: string,
  nomeExport: string,
  contexto: string,
): Promise<unknown> {
  const modulo = (await import(caminhoModulo)) as Record<string, unknown>;
  const classe = modulo[nomeExport];

  if (typeof classe !== 'function') {
    throw new Error(
      `Contrato do painel nao atendido: modulo ${contexto} deve exportar ${nomeExport}.`,
    );
  }

  return classe;
}
