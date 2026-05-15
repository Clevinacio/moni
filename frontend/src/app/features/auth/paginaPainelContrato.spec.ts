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
const caminhoModuloServicoFaturas = '../faturas/service/servico-faturas';
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

  it('deve calcular total pendente a partir das faturas reais abertas', async () => {
    const suporte = await criarSuportePaginaPainel(
      [],
      [
        {
          id: 'f-01',
          descricao: 'Conta de Luz',
          valor: 324.15,
          dataVencimento: '2026-05-20',
          paga: false,
        },
        {
          id: 'f-02',
          descricao: 'Internet Fibra',
          valor: 149.9,
          dataVencimento: '2026-05-18',
          paga: false,
        },
        {
          id: 'f-03',
          descricao: 'Fatura quitada',
          valor: 2450,
          dataVencimento: '2026-05-15',
          paga: true,
        },
      ],
    );

    expect(suporte.componente.totalPendente()).toBe(474.05);
    expect(suporte.componente.contasPendentes().map((conta) => conta.titulo)).toEqual([
      'Internet Fibra',
      'Conta de Luz',
    ]);
  });
});

type SuportePaginaPainel = {
  fixture: ComponentFixture<PaginaPainelContrato>;
  componente: PaginaPainelContrato;
};

type PaginaPainelContrato = {
  resumoFinanceiro: () => { receitas: number; despesas: number; saldo: number };
  totalPendente: () => number;
  contasPendentes: () => readonly { titulo: string }[];
};

async function criarSuportePaginaPainel(
  transacoes: readonly Transacao[],
  faturas: readonly unknown[] = [],
): Promise<SuportePaginaPainel> {
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
  const tipoServicoFaturas = await carregarClasseContrato(
    caminhoModuloServicoFaturas,
    'ServicoFaturas',
    'ServicoFaturas',
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

  const stubServicoFaturas = {
    listar: () => of(faturas),
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
      {
        provide: tipoServicoFaturas,
        useValue: stubServicoFaturas,
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
