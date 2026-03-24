import { Type, ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { readFile } from 'node:fs/promises';
import { Observable, firstValueFrom, of } from 'rxjs';

type TipoTransacao = 'RECEITA' | 'DESPESA';

type PayloadTransacao = Readonly<{
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoTransacao;
  categoria: string;
}>;

interface ContratoFormulario {
  readonly valid: boolean;
  readonly invalid: boolean;
  patchValue(value: Record<string, unknown>): void;
  get(path: string): AbstractControl | null;
  reset(value?: Record<string, unknown>): void;
}

interface SuportePaginaTransacoes {
  fixture: ComponentFixture<object>;
  componente: unknown;
  chamadasCriar: Array<Record<string, unknown>>;
  chamadasAtualizar: Array<{ id: string; payload: Record<string, unknown> }>;
  chamadasExcluir: Array<string>;
  chamadasListar: Array<Record<string, unknown> | undefined>;
  submeter(): Promise<void>;
}

const caminhoModuloPaginaTransacoes = './pages/transacoes/transacoes';
const caminhoModuloServicoTransacoes = './service/servico-transacoes';
const caminhoTemplatePaginaTransacoes =
  'src/app/features/transacoes/pages/transacoes/transacoes.html';

function resolverTemplatePaginaTransacoes(url: string): Promise<string> {
  if (url === './transacoes.html') {
    return readFile(caminhoTemplatePaginaTransacoes, 'utf-8');
  }
  if (url === './filtros-transacoes.html') {
    return readFile(
      'src/app/features/transacoes/ui/filtros-transacoes/filtros-transacoes.html',
      'utf-8',
    );
  }
  if (url === './lista-transacoes.html') {
    return readFile(
      'src/app/features/transacoes/ui/lista-transacoes/lista-transacoes.html',
      'utf-8',
    );
  }
  if (url === './input-formulario.html') {
    return readFile('src/app/shared/components/input-formulario/input-formulario.html', 'utf-8');
  }
  if (url === './botao-submit.html') {
    return readFile('src/app/shared/components/botao-submit/botao-submit.html', 'utf-8');
  }

  throw new Error(`Contrato RF02 nao atendido: recurso de template nao mapeado (${url}).`);
}

describe('RF02 - Contrato da PaginaTransacoes futura (TDD RED)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve expor o componente PaginaTransacoes no modulo esperado', async () => {
    const tipoPaginaTransacoes = await carregarClasseContrato(
      caminhoModuloPaginaTransacoes,
      'PaginaTransacoes',
      'PaginaTransacoes',
    );

    expect(typeof tipoPaginaTransacoes).toBe('function');
  });

  it('deve invalidar cadastro de transacao quando campos obrigatorios estiverem vazios', async () => {
    const suporte = await criarSuportePaginaTransacoes();
    const formulario = resolverFormulario(suporte.componente, 'PaginaTransacoes');

    formulario.patchValue({
      descricao: '',
      valor: null,
      data: '',
      tipo: '',
      categoria: '',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('descricao'), 'required')).toBe(true);
    expect(temErroValidacao(formulario.get('valor'), 'required')).toBe(true);
    expect(temErroValidacao(formulario.get('data'), 'required')).toBe(true);
    expect(temErroValidacao(formulario.get('tipo'), 'required')).toBe(true);
    expect(temErroValidacao(formulario.get('categoria'), 'required')).toBe(true);
  });

  it('deve invalidar quando valor for menor ou igual a zero', async () => {
    const suporte = await criarSuportePaginaTransacoes();
    const formulario = resolverFormulario(suporte.componente, 'PaginaTransacoes');

    formulario.patchValue({
      descricao: 'Compra mercado',
      valor: 0,
      data: '2026-03-20',
      tipo: 'DESPESA',
      categoria: 'Alimentacao',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('valor'), 'min')).toBe(true);
  });

  it('deve submeter criacao com payload estrito e nunca enviar userId', async () => {
    const suporte = await criarSuportePaginaTransacoes();
    const formulario = resolverFormulario(suporte.componente, 'PaginaTransacoes');

    formulario.patchValue({
      descricao: 'Freelance',
      valor: 1200,
      data: '2026-03-20',
      tipo: 'RECEITA',
      categoria: 'Trabalho',
    });

    await suporte.submeter();

    expect(suporte.chamadasCriar.length).toBe(1);

    const primeiraChamada = suporte.chamadasCriar[0];
    expect(primeiraChamada).toBeDefined();

    if (!primeiraChamada) {
      return;
    }

    expect(primeiraChamada).toEqual({
      descricao: 'Freelance',
      valor: 1200,
      data: '2026-03-20',
      tipo: 'RECEITA',
      categoria: 'Trabalho',
    });
    expect(Object.keys(primeiraChamada).sort()).toEqual([
      'categoria',
      'data',
      'descricao',
      'tipo',
      'valor',
    ]);
    expect(Object.prototype.hasOwnProperty.call(primeiraChamada, 'userId')).toBe(false);
  });

  it('deve suportar modo edicao para atualizar transacao existente', async () => {
    const suporte = await criarSuportePaginaTransacoes();
    const formulario = resolverFormulario(suporte.componente, 'PaginaTransacoes');

    const metodoEntrarModoEdicao = resolverMetodo(
      suporte.componente,
      ['editarTransacao', 'iniciarEdicao', 'selecionarParaEdicao'],
      'PaginaTransacoes',
    );

    metodoEntrarModoEdicao({
      id: 'tx-01',
      descricao: 'Compra mercado',
      valor: 250,
      data: '2026-03-19',
      tipo: 'DESPESA',
      categoria: 'Alimentacao',
    });

    formulario.patchValue({
      descricao: 'Compra mercado semanal',
      valor: 280,
      data: '2026-03-19',
      tipo: 'DESPESA',
      categoria: 'Alimentacao',
    });

    await suporte.submeter();

    expect(suporte.chamadasAtualizar.length).toBe(1);
    expect(suporte.chamadasAtualizar[0]).toEqual({
      id: 'tx-01',
      payload: {
        descricao: 'Compra mercado semanal',
        valor: 280,
        data: '2026-03-19',
        tipo: 'DESPESA',
        categoria: 'Alimentacao',
      },
    });
  });

  it('deve excluir transacao selecionada', async () => {
    const suporte = await criarSuportePaginaTransacoes();

    const metodoExcluir = resolverMetodo(
      suporte.componente,
      ['excluirTransacao', 'removerTransacao'],
      'PaginaTransacoes',
    );

    const resultado = metodoExcluir('tx-20');
    await aguardarResultadoPossivelmenteAssincrono(resultado);

    expect(suporte.chamadasExcluir).toEqual(['tx-20']);
  });

  it('deve aplicar filtro por periodo e filtro mensal em chamadas de listagem', async () => {
    const suporte = await criarSuportePaginaTransacoes();

    const metodoFiltrarPeriodo = resolverMetodo(
      suporte.componente,
      ['aplicarFiltroPeriodo', 'filtrarPorPeriodo'],
      'PaginaTransacoes',
    );

    const resultadoPeriodo = metodoFiltrarPeriodo('2026-03-01', '2026-03-31');
    await aguardarResultadoPossivelmenteAssincrono(resultadoPeriodo);

    const metodoFiltrarMes = resolverMetodo(
      suporte.componente,
      ['aplicarFiltroMensal', 'filtrarPorMes'],
      'PaginaTransacoes',
    );

    const resultadoMes = metodoFiltrarMes(3, 2026);
    await aguardarResultadoPossivelmenteAssincrono(resultadoMes);

    expect(suporte.chamadasListar).toEqual([
      undefined,
      { dataInicio: '2026-03-01', dataFim: '2026-03-31' },
      { mes: 3, ano: 2026 },
    ]);
  });
});

async function criarSuportePaginaTransacoes(): Promise<SuportePaginaTransacoes> {
  const tipoPaginaTransacoes = await carregarClasseContrato(
    caminhoModuloPaginaTransacoes,
    'PaginaTransacoes',
    'PaginaTransacoes',
  );
  const tipoServicoTransacoes = await carregarClasseContrato(
    caminhoModuloServicoTransacoes,
    'ServicoTransacoes',
    'ServicoTransacoes',
  );

  const chamadasCriar: Array<Record<string, unknown>> = [];
  const chamadasAtualizar: Array<{ id: string; payload: Record<string, unknown> }> = [];
  const chamadasExcluir: Array<string> = [];
  const chamadasListar: Array<Record<string, unknown> | undefined> = [];

  const stubServicoTransacoes = {
    listar: (filtros?: Record<string, unknown>): Observable<unknown> => {
      chamadasListar.push(filtros ? { ...filtros } : undefined);
      return of([]);
    },
    criar: (payload: unknown): Observable<unknown> => {
      if (ehRegistro(payload)) {
        chamadasCriar.push({ ...payload });
      }

      return of(construirTransacaoResposta('tx-01', payload));
    },
    atualizar: (id: string, payload: unknown): Observable<unknown> => {
      if (ehRegistro(payload)) {
        chamadasAtualizar.push({ id, payload: { ...payload } });
      }

      return of(construirTransacaoResposta(id, payload));
    },
    excluir: (id: string): Observable<unknown> => {
      chamadasExcluir.push(id);
      return of(void 0);
    },
  };

  await resolveComponentResources(resolverTemplatePaginaTransacoes);

  TestBed.configureTestingModule({
    imports: [tipoPaginaTransacoes],
    providers: [
      {
        provide: tipoServicoTransacoes,
        useValue: stubServicoTransacoes,
      },
    ],
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(tipoPaginaTransacoes as Type<object>);
  fixture.detectChanges();

  return {
    fixture,
    componente: fixture.componentInstance as unknown,
    chamadasCriar,
    chamadasAtualizar,
    chamadasExcluir,
    chamadasListar,
    submeter: async () => {
      const metodoSubmissao = resolverMetodo(
        fixture.componentInstance as unknown,
        ['onSubmit', 'submeter', 'salvarTransacao'],
        'PaginaTransacoes',
      );

      const resultado = metodoSubmissao();
      await aguardarResultadoPossivelmenteAssincrono(resultado);
      fixture.detectChanges();
      await fixture.whenStable();
    },
  };
}

function construirTransacaoResposta(id: string, payload: unknown): Record<string, unknown> {
  const dados = ehRegistro(payload) ? payload : {};

  return {
    id,
    descricao: dados['descricao'] ?? 'Descricao',
    valor: dados['valor'] ?? 1,
    data: dados['data'] ?? '2026-03-20',
    tipo: dados['tipo'] ?? 'RECEITA',
    categoria: dados['categoria'] ?? 'Categoria',
  };
}

function resolverFormulario(componente: unknown, nomeContexto: string): ContratoFormulario {
  if (!ehRegistro(componente)) {
    throw new Error(
      `Contrato RF02 nao atendido: ${nomeContexto} precisa ser um objeto de componente.`,
    );
  }

  const nomesPreferenciais = [
    'formulario',
    'formularioTransacao',
    'formTransacao',
    'form',
  ] as const;

  for (const nomePropriedade of nomesPreferenciais) {
    const candidato = Reflect.get(componente, nomePropriedade);
    if (ehContratoFormulario(candidato)) {
      return candidato;
    }
  }

  for (const candidato of Object.values(componente)) {
    if (ehContratoFormulario(candidato)) {
      return candidato;
    }
  }

  throw new Error(
    `Contrato RF02 nao atendido: ${nomeContexto} precisa expor um FormGroup com descricao, valor, data, tipo e categoria.`,
  );
}

function resolverMetodo(
  componente: unknown,
  nomesCandidatos: readonly string[],
  nomeContexto: string,
): (...args: unknown[]) => unknown {
  if (!ehRegistro(componente)) {
    throw new Error(
      `Contrato RF02 nao atendido: ${nomeContexto} precisa ser um objeto de componente.`,
    );
  }

  for (const nomeMetodo of nomesCandidatos) {
    const candidato = Reflect.get(componente, nomeMetodo);

    if (typeof candidato === 'function') {
      return (...args: unknown[]) => candidato.call(componente, ...args);
    }
  }

  throw new Error(
    `Contrato RF02 nao atendido: ${nomeContexto} precisa expor metodo entre [${nomesCandidatos.join(', ')}].`,
  );
}

async function aguardarResultadoPossivelmenteAssincrono(valor: unknown): Promise<void> {
  if (valor instanceof Promise) {
    await valor;
    return;
  }

  if (ehObservable(valor)) {
    await firstValueFrom(valor);
  }
}

function temErroValidacao(controle: AbstractControl | null, nomeErro: string): boolean {
  return controle?.hasError(nomeErro) ?? false;
}

async function carregarClasseContrato(
  caminhoModulo: string,
  nomeSimbolo: string,
  nomeContexto: string,
): Promise<Type<unknown>> {
  try {
    const caminhoDinamicoModulo = caminhoModulo;
    const moduloImportado = (await import(/* @vite-ignore */ caminhoDinamicoModulo)) as unknown;

    if (!ehRegistro(moduloImportado)) {
      throw new Error('Modulo importado sem estrutura de objeto.');
    }

    const simboloExportado = moduloImportado[nomeSimbolo];

    if (typeof simboloExportado !== 'function') {
      throw new Error(`Simbolo ${nomeSimbolo} ausente ou invalido no modulo ${caminhoModulo}.`);
    }

    return simboloExportado as Type<unknown>;
  } catch (erro) {
    const detalhes = paraMensagemErro(erro);

    throw new Error(
      `Contrato RF02 nao atendido: nao foi possivel carregar ${nomeContexto} em ${caminhoModulo}. Crie o modulo futuro e exporte ${nomeSimbolo}. Detalhe: ${detalhes}`,
    );
  }
}

function ehContratoFormulario(valor: unknown): valor is ContratoFormulario {
  if (!ehRegistro(valor)) {
    return false;
  }

  return (
    typeof valor['patchValue'] === 'function' &&
    typeof valor['get'] === 'function' &&
    typeof valor['reset'] === 'function' &&
    typeof valor['valid'] === 'boolean' &&
    typeof valor['invalid'] === 'boolean'
  );
}

function ehObservable(valor: unknown): valor is Observable<unknown> {
  return ehRegistro(valor) && typeof valor['subscribe'] === 'function';
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function paraMensagemErro(valor: unknown): string {
  if (valor instanceof Error) {
    return valor.message;
  }

  if (typeof valor === 'string') {
    return valor;
  }

  return JSON.stringify(valor);
}
