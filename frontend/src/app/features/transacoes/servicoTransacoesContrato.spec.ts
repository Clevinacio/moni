import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';

type TipoTransacao = 'RECEITA' | 'DESPESA';

type PayloadTransacao = Readonly<{
  descricao: string;
  valor: number;
  data: string;
  tipo: TipoTransacao;
  categoria: Readonly<{
    id?: string;
    nome?: string;
  }>;
}>;

type FiltroPeriodo = Readonly<{
  dataInicio: string;
  dataFim: string;
}>;

type FiltroMes = Readonly<{
  mes: number;
  ano: number;
}>;

type FiltroCategoria = Readonly<{
  categoriaId: string;
}>;

type FiltrosTransacao = Readonly<{
  dataInicio?: string;
  dataFim?: string;
  mes?: number;
  ano?: number;
  categoriaId?: string;
}>;

interface ContratoServicoTransacoes {
  listar(filtros?: FiltrosTransacao): Observable<unknown>;
  criar(payload: PayloadTransacao): Observable<unknown>;
  atualizar(id: string, payload: PayloadTransacao): Observable<unknown>;
  excluir(id: string): Observable<unknown>;
}

interface SuporteServicoTransacoes {
  servico: ContratoServicoTransacoes;
  controladorHttp: HttpTestingController;
}

const caminhoModuloServicoTransacoes = './service/servico-transacoes';
const endpointTransacoes = '/api/v1/transactions';
const camposTransacaoEsperados = ['categoria', 'data', 'descricao', 'id', 'tipo', 'valor'] as const;

describe('RF02 - Contrato do ServicoTransacoes futuro (TDD RED)', () => {
  afterEach(() => {
    try {
      TestBed.inject(HttpTestingController).verify();
    } catch {
      // Ignora cenarios sem HttpTestingController configurado.
    }

    TestBed.resetTestingModule();
  });

  it('deve expor os metodos listar, criar, atualizar e excluir no ServicoTransacoes futuro', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    expect(typeof suporte.servico.listar).toBe('function');
    expect(typeof suporte.servico.criar).toBe('function');
    expect(typeof suporte.servico.atualizar).toBe('function');
    expect(typeof suporte.servico.excluir).toBe('function');
  });

  it('deve listar transacoes em GET /api/v1/transactions sem filtros', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessaResposta = firstValueFrom(suporte.servico.listar());
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointTransacoes);

    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.keys().length).toBe(0);

    requisicao.flush([construirTransacaoRespostaValida()]);

    const resposta = await promessaResposta;
    validarListaTransacoesEstrita(resposta);
  });

  it('deve listar transacoes com filtro de periodo e serializar dataInicio/dataFim', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessaResposta = firstValueFrom(
      suporte.servico.listar({
        dataInicio: '2026-03-01',
        dataFim: '2026-03-31',
      }),
    );

    const requisicao = suporte.controladorHttp.expectOne(
      (valor) =>
        extrairCaminhoUrl(valor.url) === endpointTransacoes &&
        valor.params.get('dataInicio') === '2026-03-01' &&
        valor.params.get('dataFim') === '2026-03-31',
    );

    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.has('mes')).toBe(false);
    expect(requisicao.request.params.has('ano')).toBe(false);

    requisicao.flush([construirTransacaoRespostaValida()]);

    const resposta = await promessaResposta;
    validarListaTransacoesEstrita(resposta);
  });

  it('deve listar transacoes com filtro mensal e serializar mes/ano', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessaResposta = firstValueFrom(
      suporte.servico.listar({
        mes: 3,
        ano: 2026,
      }),
    );

    const requisicao = suporte.controladorHttp.expectOne(
      (valor) =>
        extrairCaminhoUrl(valor.url) === endpointTransacoes &&
        valor.params.get('mes') === '3' &&
        valor.params.get('ano') === '2026',
    );

    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.has('dataInicio')).toBe(false);
    expect(requisicao.request.params.has('dataFim')).toBe(false);

    requisicao.flush([construirTransacaoRespostaValida()]);

    const resposta = await promessaResposta;
    validarListaTransacoesEstrita(resposta);
  });

  it('deve listar transacoes com filtro por categoria e serializar categoriaId', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessaResposta = firstValueFrom(
      suporte.servico.listar({
        categoriaId: 'cat-01',
      }),
    );

    const requisicao = suporte.controladorHttp.expectOne(
      (valor) =>
        extrairCaminhoUrl(valor.url) === endpointTransacoes &&
        valor.params.get('categoriaId') === 'cat-01',
    );

    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.has('dataInicio')).toBe(false);
    expect(requisicao.request.params.has('dataFim')).toBe(false);
    expect(requisicao.request.params.has('mes')).toBe(false);
    expect(requisicao.request.params.has('ano')).toBe(false);

    requisicao.flush([construirTransacaoRespostaValida()]);

    const resposta = await promessaResposta;
    validarListaTransacoesEstrita(resposta);
  });

  it('deve listar transacoes com filtro mensal e categoria em conjunto', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessaResposta = firstValueFrom(
      suporte.servico.listar({
        mes: 3,
        ano: 2026,
        categoriaId: 'cat-01',
      }),
    );

    const requisicao = suporte.controladorHttp.expectOne(
      (valor) =>
        extrairCaminhoUrl(valor.url) === endpointTransacoes &&
        valor.params.get('mes') === '3' &&
        valor.params.get('ano') === '2026' &&
        valor.params.get('categoriaId') === 'cat-01',
    );

    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.has('dataInicio')).toBe(false);
    expect(requisicao.request.params.has('dataFim')).toBe(false);

    requisicao.flush([construirTransacaoRespostaValida()]);

    const resposta = await promessaResposta;
    validarListaTransacoesEstrita(resposta);
  });

  it('deve criar transacao em POST /api/v1/transactions sem enviar userId', async () => {
    const suporte = await criarSuporteServicoTransacoes();
    const payload = construirPayloadTransacaoValido();

    const promessaResposta = firstValueFrom(suporte.servico.criar(payload));
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointTransacoes);

    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(payload);
    expect(Object.keys(requisicao.request.body).sort()).toEqual([
      'categoria',
      'data',
      'descricao',
      'tipo',
      'valor',
    ]);
    expect(requisicao.request.body.categoria).toEqual({ id: 'cat-01' });
    expect(temPropriedadePropria(requisicao.request.body, 'userId')).toBe(false);

    requisicao.flush(construirTransacaoRespostaValida());

    const resposta = await promessaResposta;
    validarTransacaoEstrita(resposta, 'criar');
  });

  it('deve atualizar transacao em PUT /api/v1/transactions/{id} sem enviar userId', async () => {
    const suporte = await criarSuporteServicoTransacoes();
    const payload = construirPayloadTransacaoValido();

    const promessaResposta = firstValueFrom(suporte.servico.atualizar('tx-01', payload));
    const requisicao = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      `${endpointTransacoes}/tx-01`,
    );

    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual(payload);
    expect(temPropriedadePropria(requisicao.request.body, 'userId')).toBe(false);

    requisicao.flush({
      ...construirTransacaoRespostaValida(),
      id: 'tx-01',
    });

    const resposta = await promessaResposta;
    validarTransacaoEstrita(resposta, 'atualizar');
  });

  it('deve excluir transacao em DELETE /api/v1/transactions/{id} com status 204', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessaResposta = firstValueFrom(suporte.servico.excluir('tx-02'));
    const requisicao = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      `${endpointTransacoes}/tx-02`,
    );

    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null, { status: 204, statusText: 'No Content' });

    await promessaResposta;
  });

  it('deve tratar erro 400 ao listar com filtros invalidos', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessa = firstValueFrom(
      suporte.servico.listar({
        dataInicio: '2026-03-01',
        dataFim: '2026-03-31',
      }),
    );

    const requisicao = suporte.controladorHttp.expectOne(
      (valor) => extrairCaminhoUrl(valor.url) === endpointTransacoes && valor.method === 'GET',
    );

    requisicao.flush(
      {
        timestamp: '2026-03-23T12:00:00Z',
        status: 400,
        erro: 'Bad Request',
        mensagem: 'Use filtro por intervalo ou por mes/ano, nao ambos.',
      },
      { status: 400, statusText: 'Bad Request' },
    );

    const erro = await capturarFalha(promessa);
    expect(lerStatusHttp(erro)).toBe(400);
  });

  it('deve tratar erro 401 ao listar sem autenticacao', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessa = firstValueFrom(suporte.servico.listar());
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointTransacoes);

    requisicao.flush(
      {
        timestamp: '2026-03-23T12:00:00Z',
        status: 401,
        erro: 'Unauthorized',
        mensagem: 'Credenciais invalidas.',
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    const erro = await capturarFalha(promessa);
    expect(lerStatusHttp(erro)).toBe(401);
  });

  it('deve tratar erro 403 ao atualizar transacao de outro usuario', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessa = firstValueFrom(
      suporte.servico.atualizar('tx-03', construirPayloadTransacaoValido()),
    );
    const requisicao = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      `${endpointTransacoes}/tx-03`,
    );

    requisicao.flush(
      {
        timestamp: '2026-03-23T12:00:00Z',
        status: 403,
        erro: 'Forbidden',
        mensagem: 'Acesso negado para esta transacao.',
      },
      { status: 403, statusText: 'Forbidden' },
    );

    const erro = await capturarFalha(promessa);
    expect(lerStatusHttp(erro)).toBe(403);
  });

  it('deve tratar erro 404 ao excluir transacao inexistente', async () => {
    const suporte = await criarSuporteServicoTransacoes();

    const promessa = firstValueFrom(suporte.servico.excluir('tx-404'));
    const requisicao = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      `${endpointTransacoes}/tx-404`,
    );

    requisicao.flush(
      {
        timestamp: '2026-03-23T12:00:00Z',
        status: 404,
        erro: 'Not Found',
        mensagem: 'Transacao nao encontrada.',
      },
      { status: 404, statusText: 'Not Found' },
    );

    const erro = await capturarFalha(promessa);
    expect(lerStatusHttp(erro)).toBe(404);
  });
});

async function criarSuporteServicoTransacoes(): Promise<SuporteServicoTransacoes> {
  const tipoServicoTransacoes = await carregarTipoServicoTransacoes();

  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), tipoServicoTransacoes],
  });

  const instancia = TestBed.inject(tipoServicoTransacoes);

  return {
    servico: comoContratoServicoTransacoes(instancia),
    controladorHttp: TestBed.inject(HttpTestingController),
  };
}

async function carregarTipoServicoTransacoes(): Promise<Type<unknown>> {
  const modulo = await importarModuloContrato(
    caminhoModuloServicoTransacoes,
    'ServicoTransacoes',
    'ServicoTransacoes',
  );

  const tipoExportado = modulo['ServicoTransacoes'];

  if (typeof tipoExportado !== 'function') {
    throw new Error(
      'Contrato RF02 nao atendido: o modulo de transacoes precisa exportar ServicoTransacoes como classe/funcao.',
    );
  }

  return tipoExportado as Type<unknown>;
}

function comoContratoServicoTransacoes(instancia: unknown): ContratoServicoTransacoes {
  const metodoListar = lerMetodo<FiltrosTransacao | undefined>(
    instancia,
    'listar',
    'ServicoTransacoes',
  );
  const metodoCriar = lerMetodo<PayloadTransacao>(instancia, 'criar', 'ServicoTransacoes');
  const metodoAtualizar = lerMetodo<[string, PayloadTransacao]>(
    instancia,
    'atualizar',
    'ServicoTransacoes',
  );
  const metodoExcluir = lerMetodo<string>(instancia, 'excluir', 'ServicoTransacoes');

  return {
    listar: (filtros?: FiltrosTransacao) => {
      const saida = metodoListar(filtros);
      return garantirObservable(saida, 'listar');
    },
    criar: (payload) => {
      const saida = metodoCriar(payload);
      return garantirObservable(saida, 'criar');
    },
    atualizar: (id, payload) => {
      const candidato = Reflect.get(instancia as Record<string, unknown>, 'atualizar');
      const saida =
        typeof candidato === 'function'
          ? candidato.call(instancia, id, payload)
          : metodoAtualizar([id, payload]);

      return garantirObservable(saida, 'atualizar');
    },
    excluir: (id) => {
      const saida = metodoExcluir(id);
      return garantirObservable(saida, 'excluir');
    },
  };
}

function lerMetodo<Payload>(
  valor: unknown,
  nomeMetodo: string,
  nomeContexto: string,
): (payload: Payload) => unknown {
  if (!ehRegistro(valor)) {
    throw new Error(
      `Contrato RF02 nao atendido: ${nomeContexto} precisa ser um objeto instanciavel.`,
    );
  }

  const candidato = Reflect.get(valor, nomeMetodo);

  if (typeof candidato !== 'function') {
    throw new Error(`Contrato RF02 nao atendido: ${nomeContexto}.${nomeMetodo} precisa existir.`);
  }

  return (payload: Payload) => candidato.call(valor, payload);
}

function garantirObservable(valor: unknown, nomeMetodo: string): Observable<unknown> {
  if (!ehObservable(valor)) {
    throw new Error(
      `Contrato RF02 nao atendido: ServicoTransacoes.${nomeMetodo} deve retornar Observable.`,
    );
  }

  return valor;
}

function construirPayloadTransacaoValido(): PayloadTransacao {
  return {
    descricao: 'Salario do mes',
    valor: 4500,
    data: '2026-03-20',
    tipo: 'RECEITA',
    categoria: {
      id: 'cat-01',
    },
  };
}

function construirTransacaoRespostaValida(): Record<string, unknown> {
  return {
    id: 'tx-01',
    descricao: 'Salario do mes',
    valor: 4500,
    data: '2026-03-20',
    tipo: 'RECEITA',
    categoria: 'Trabalho',
  };
}

function validarListaTransacoesEstrita(valor: unknown): void {
  if (!Array.isArray(valor)) {
    throw new Error('Resposta de listagem invalida: esperado array de transacoes.');
  }

  for (const item of valor) {
    validarTransacaoEstrita(item, 'listagem');
  }
}

function validarTransacaoEstrita(valor: unknown, contexto: string): void {
  if (!ehRegistro(valor)) {
    throw new Error(`Resposta de ${contexto} invalida: esperado objeto JSON.`);
  }

  const chavesAtuais = Object.keys(valor).sort();
  const chavesEsperadas = [...camposTransacaoEsperados].sort();

  const formatoEstritoValido =
    chavesAtuais.length === chavesEsperadas.length &&
    chavesAtuais.every((chave, indice) => chave === chavesEsperadas[indice]);

  if (!formatoEstritoValido) {
    throw new Error(`Resposta de ${contexto} invalida: formato de campos inesperado.`);
  }

  if (
    !ehTexto(valor['id']) ||
    !ehTexto(valor['descricao']) ||
    !ehTexto(valor['data']) ||
    !ehTexto(valor['categoria'])
  ) {
    throw new Error(`Resposta de ${contexto} invalida: campos de texto ausentes ou invalidos.`);
  }

  if (!ehNumero(valor['valor'])) {
    throw new Error(`Resposta de ${contexto} invalida: valor deve ser numerico.`);
  }

  if (!ehTipoTransacao(valor['tipo'])) {
    throw new Error(`Resposta de ${contexto} invalida: tipo deve ser RECEITA ou DESPESA.`);
  }
}

async function importarModuloContrato(
  caminhoModulo: string,
  nomeExport: string,
  nomeContexto: string,
): Promise<Record<string, unknown>> {
  try {
    const caminhoDinamicoModulo = caminhoModulo;
    const moduloImportado = (await import(/* @vite-ignore */ caminhoDinamicoModulo)) as unknown;

    if (!ehRegistro(moduloImportado)) {
      throw new Error('Modulo importado sem estrutura de objeto.');
    }

    if (!(nomeExport in moduloImportado)) {
      throw new Error(`Simbolo ${nomeExport} ausente.`);
    }

    return moduloImportado;
  } catch (erro) {
    const detalhes = paraMensagemErro(erro);

    throw new Error(
      `Contrato RF02 nao atendido: nao foi possivel carregar ${nomeContexto} em ${caminhoModulo}. Crie o modulo futuro e exporte ${nomeExport}. Detalhe: ${detalhes}`,
    );
  }
}

function ehTipoTransacao(valor: unknown): valor is TipoTransacao {
  return valor === 'RECEITA' || valor === 'DESPESA';
}

function ehNumero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}

function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function ehObservable(valor: unknown): valor is Observable<unknown> {
  return ehRegistro(valor) && typeof valor['subscribe'] === 'function';
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function temPropriedadePropria(valor: unknown, chave: string): boolean {
  return ehRegistro(valor) && Object.prototype.hasOwnProperty.call(valor, chave);
}

function esperarRequisicaoPorCaminho(
  controladorHttp: HttpTestingController,
  caminhoEsperado: string,
) {
  return controladorHttp.expectOne((requisicao) => extrairCaminhoUrl(requisicao.url) === caminhoEsperado);
}

function extrairCaminhoUrl(url: string): string {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

async function capturarFalha(promessa: Promise<unknown>): Promise<unknown> {
  try {
    await promessa;
    throw new Error('A promessa deveria ter sido rejeitada pelo contrato da RF02.');
  } catch (erro) {
    return erro;
  }
}

function lerStatusHttp(erro: unknown): number | null {
  if (erro instanceof HttpErrorResponse) {
    return erro.status;
  }

  if (ehRegistro(erro) && typeof erro['status'] === 'number') {
    return erro['status'];
  }

  return null;
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
