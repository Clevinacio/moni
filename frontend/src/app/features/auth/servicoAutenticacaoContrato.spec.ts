import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';

type PayloadCadastro = Readonly<{
  name: string;
  email: string;
  password: string;
}>;

type PayloadLogin = Readonly<{
  email: string;
  password: string;
}>;

interface ContratoServicoAutenticacao {
  cadastrar(payload: PayloadCadastro): Observable<unknown>;
  autenticar(payload: PayloadLogin): Observable<unknown>;
}

interface SuporteServicoAutenticacao {
  servico: ContratoServicoAutenticacao;
  controladorHttp: HttpTestingController;
}

const caminhoModuloServicoAutenticacao = './service/servico-autenticacao';
const endpointCadastro = '/api/v1/auth/register';
const endpointLogin = '/api/v1/auth/login';
const camposSucessoCadastro = ['id', 'name', 'email', 'token'] as const;
const camposSucessoLogin = ['token', 'type', 'userId', 'name'] as const;

describe('RF01 - Contrato do ServicoAutenticacao futuro (TDD RED)', () => {
  afterEach(() => {
    try {
      TestBed.inject(HttpTestingController).verify();
    } catch {
      // Ignora cenarios sem HttpTestingController configurado.
    }

    TestBed.resetTestingModule();
  });

  it('deve expor os metodos cadastrar e autenticar no ServicoAutenticacao futuro', async () => {
    const suporte = await criarSuporteServicoAutenticacao();

    expect(typeof suporte.servico.cadastrar).toBe('function');
    expect(typeof suporte.servico.autenticar).toBe('function');
  });

  it('deve enviar cadastro apenas com name,email,password para /api/v1/auth/register', async () => {
    const suporte = await criarSuporteServicoAutenticacao();
    const payload = construirPayloadCadastroValido();

    const promessaResposta = executarCadastro(suporte.servico, payload);
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointCadastro);

    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(payload);
    expect(chavesOrdenadas(requisicao.request.body)).toEqual(['email', 'name', 'password']);

    requisicao.flush({
      id: 'u-01',
      name: payload.name,
      email: payload.email,
      token: 'jwt-token-valido',
    });

    const resposta = await promessaResposta;
    validarFormatoSucessoEstrito(resposta, camposSucessoCadastro, 'cadastro');
  });

  it('deve enviar autenticacao apenas com email,password para /api/v1/auth/login', async () => {
    const suporte = await criarSuporteServicoAutenticacao();
    const payload = construirPayloadLoginValido();

    const promessaResposta = executarAutenticacao(suporte.servico, payload);
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointLogin);

    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(payload);
    expect(chavesOrdenadas(requisicao.request.body)).toEqual(['email', 'password']);

    requisicao.flush({
      token: 'jwt-token-valido',
      type: 'Bearer',
      userId: 'u-01',
      name: 'Ana',
    });

    const resposta = await promessaResposta;
    validarFormatoSucessoEstrito(resposta, camposSucessoLogin, 'autenticacao');
  });

  it('nunca deve enviar userId no body de cadastro e autenticacao', async () => {
    const suporte = await criarSuporteServicoAutenticacao();

    const promessaCadastro = executarCadastro(suporte.servico, construirPayloadCadastroValido());
    const requisicaoCadastro = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      endpointCadastro,
    );

    expect(temPropriedadePropria(requisicaoCadastro.request.body, 'userId')).toBe(false);
    requisicaoCadastro.flush({
      id: 'u-01',
      name: 'Ana',
      email: 'ana@moni.com',
      token: 'jwt-token-valido',
    });
    await promessaCadastro;

    const promessaAutenticacao = executarAutenticacao(
      suporte.servico,
      construirPayloadLoginValido(),
    );
    const requisicaoAutenticacao = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      endpointLogin,
    );

    expect(temPropriedadePropria(requisicaoAutenticacao.request.body, 'userId')).toBe(false);
    requisicaoAutenticacao.flush({
      token: 'jwt-token-valido',
      type: 'Bearer',
      userId: 'u-01',
      name: 'Ana',
    });
    await promessaAutenticacao;
  });

  it('deve tratar sucesso de cadastro de forma estrita: id,name,email,token', async () => {
    const suporte = await criarSuporteServicoAutenticacao();
    const payload = construirPayloadCadastroValido();

    const promessaSucesso = executarCadastro(suporte.servico, payload);
    const requisicaoSucesso = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      endpointCadastro,
    );

    requisicaoSucesso.flush({
      id: 'u-01',
      name: payload.name,
      email: payload.email,
      token: 'jwt-token-valido',
    });

    const respostaSucesso = await promessaSucesso;
    validarFormatoSucessoEstrito(respostaSucesso, camposSucessoCadastro, 'cadastro');

    const promessaInvalida = executarCadastro(suporte.servico, payload);
    const requisicaoInvalida = esperarRequisicaoPorCaminho(
      suporte.controladorHttp,
      endpointCadastro,
    );

    requisicaoInvalida.flush({
      id: 'u-01',
      name: payload.name,
      email: payload.email,
    });

    await esperarFalhaObrigatoria(
      promessaInvalida,
      'A resposta de cadastro sem token deveria ser rejeitada pelo contrato estrito da RF01.',
    );
  });

  it('deve tratar sucesso de autenticacao de forma estrita: token,type,userId,name', async () => {
    const suporte = await criarSuporteServicoAutenticacao();
    const payload = construirPayloadLoginValido();

    const promessaSucesso = executarAutenticacao(suporte.servico, payload);
    const requisicaoSucesso = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointLogin);

    requisicaoSucesso.flush({
      token: 'jwt-token-valido',
      type: 'Bearer',
      userId: 'u-01',
      name: 'Ana',
    });

    const respostaSucesso = await promessaSucesso;
    validarFormatoSucessoEstrito(respostaSucesso, camposSucessoLogin, 'autenticacao');

    const promessaInvalida = executarAutenticacao(suporte.servico, payload);
    const requisicaoInvalida = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointLogin);

    requisicaoInvalida.flush({
      token: 'jwt-token-valido',
      type: 'Bearer',
    });

    await esperarFalhaObrigatoria(
      promessaInvalida,
      'A resposta de autenticacao sem userId deveria ser rejeitada pelo contrato estrito da RF01.',
    );
  });

  it('deve tratar erro 400 ao cadastrar', async () => {
    const suporte = await criarSuporteServicoAutenticacao();

    const promessaResposta = executarCadastro(suporte.servico, construirPayloadCadastroValido());
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointCadastro);

    requisicao.flush(
      {
        timestamp: '2026-03-14T10:00:00Z',
        status: 400,
        erro: 'Bad Request',
        mensagem: 'Dados de cadastro invalidos',
      },
      { status: 400, statusText: 'Bad Request' },
    );

    const erro = await capturarFalha(promessaResposta);
    expect(lerStatusHttp(erro)).toBe(400);
  });

  it('deve tratar erro 401 ao autenticar', async () => {
    const suporte = await criarSuporteServicoAutenticacao();

    const promessaResposta = executarAutenticacao(suporte.servico, construirPayloadLoginValido());
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointLogin);

    requisicao.flush(
      {
        timestamp: '2026-03-14T10:00:00Z',
        status: 401,
        erro: 'Unauthorized',
        mensagem: 'Credenciais invalidas',
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    const erro = await capturarFalha(promessaResposta);
    expect(lerStatusHttp(erro)).toBe(401);
  });

  it('deve tratar erro 409 ao cadastrar email duplicado', async () => {
    const suporte = await criarSuporteServicoAutenticacao();

    const promessaResposta = executarCadastro(suporte.servico, construirPayloadCadastroValido());
    const requisicao = esperarRequisicaoPorCaminho(suporte.controladorHttp, endpointCadastro);

    requisicao.flush(
      {
        timestamp: '2026-03-14T10:00:00Z',
        status: 409,
        erro: 'Conflict',
        mensagem: 'E-mail ja cadastrado',
      },
      { status: 409, statusText: 'Conflict' },
    );

    const erro = await capturarFalha(promessaResposta);
    expect(lerStatusHttp(erro)).toBe(409);
  });
});

async function criarSuporteServicoAutenticacao(): Promise<SuporteServicoAutenticacao> {
  const tipoServicoAutenticacao = await carregarTipoServicoAutenticacao();

  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), tipoServicoAutenticacao],
  });

  const instancia = TestBed.inject(tipoServicoAutenticacao);

  return {
    servico: comoContratoServicoAutenticacao(instancia),
    controladorHttp: TestBed.inject(HttpTestingController),
  };
}

async function carregarTipoServicoAutenticacao(): Promise<Type<unknown>> {
  const modulo = await importarModuloContrato(
    caminhoModuloServicoAutenticacao,
    'ServicoAutenticacao',
    'ServicoAutenticacao',
  );

  const tipoExportado = modulo['ServicoAutenticacao'];

  if (typeof tipoExportado !== 'function') {
    throw new Error(
      'Contrato RF01 nao atendido: o modulo de autenticacao precisa exportar ServicoAutenticacao como classe/funcao.',
    );
  }

  return tipoExportado as Type<unknown>;
}

function comoContratoServicoAutenticacao(instancia: unknown): ContratoServicoAutenticacao {
  const metodoCadastrar = lerMetodo<PayloadCadastro>(instancia, 'cadastrar', 'ServicoAutenticacao');
  const metodoAutenticar = lerMetodo<PayloadLogin>(instancia, 'autenticar', 'ServicoAutenticacao');

  return {
    cadastrar: (payload) => {
      const saida = metodoCadastrar(payload);
      return garantirObservable(saida, 'cadastrar');
    },
    autenticar: (payload) => {
      const saida = metodoAutenticar(payload);
      return garantirObservable(saida, 'autenticar');
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
      `Contrato RF01 nao atendido: ${nomeContexto} precisa ser um objeto instanciavel.`,
    );
  }

  const candidato = Reflect.get(valor, nomeMetodo);

  if (typeof candidato !== 'function') {
    throw new Error(`Contrato RF01 nao atendido: ${nomeContexto}.${nomeMetodo} precisa existir.`);
  }

  return (payload: Payload) => candidato.call(valor, payload);
}

function garantirObservable(valor: unknown, nomeMetodo: string): Observable<unknown> {
  if (!ehObservable(valor)) {
    throw new Error(
      `Contrato RF01 nao atendido: ServicoAutenticacao.${nomeMetodo} deve retornar Observable.`,
    );
  }

  return valor;
}

function executarCadastro(
  servico: ContratoServicoAutenticacao,
  payload: PayloadCadastro,
): Promise<unknown> {
  try {
    return firstValueFrom(servico.cadastrar(payload));
  } catch (erro) {
    return Promise.reject(erro);
  }
}

function executarAutenticacao(
  servico: ContratoServicoAutenticacao,
  payload: PayloadLogin,
): Promise<unknown> {
  try {
    return firstValueFrom(servico.autenticar(payload));
  } catch (erro) {
    return Promise.reject(erro);
  }
}

function validarFormatoSucessoEstrito(
  valor: unknown,
  camposEsperados: readonly string[],
  nomeContexto: string,
): void {
  if (!ehRegistro(valor)) {
    throw new Error(
      `Contrato RF01 nao atendido: ${nomeContexto} deve retornar um objeto de sucesso.`,
    );
  }

  const camposAtuais = Object.keys(valor).sort();
  const camposEsperadosOrdenados = [...camposEsperados].sort();

  expect(camposAtuais).toEqual(camposEsperadosOrdenados);

  for (const campo of camposEsperados) {
    expect(valor[campo]).not.toBeUndefined();
  }
}

async function capturarFalha(promessa: Promise<unknown>): Promise<unknown> {
  try {
    await promessa;
  } catch (erro) {
    return erro;
  }

  throw new Error('Era esperado erro, mas a operacao foi concluida com sucesso.');
}

async function esperarFalhaObrigatoria(
  promessa: Promise<unknown>,
  mensagemQuandoSucessoInesperado: string,
): Promise<void> {
  try {
    await promessa;
  } catch {
    return;
  }

  throw new Error(mensagemQuandoSucessoInesperado);
}

function lerStatusHttp(erro: unknown): number | null {
  if (erro instanceof HttpErrorResponse) {
    return erro.status;
  }

  if (!ehRegistro(erro)) {
    return null;
  }

  const candidatoStatus = erro['status'];
  return typeof candidatoStatus === 'number' ? candidatoStatus : null;
}

async function importarModuloContrato(
  caminhoModulo: string,
  nomeSimbolo: string,
  nomeContexto: string,
): Promise<Record<string, unknown>> {
  try {
    const caminhoDinamicoModulo = caminhoModulo;
    const moduloImportado = (await import(/* @vite-ignore */ caminhoDinamicoModulo)) as unknown;

    if (!ehRegistro(moduloImportado)) {
      throw new Error(
        `O modulo ${caminhoModulo} foi carregado, mas nao retornou um objeto valido.`,
      );
    }

    return moduloImportado;
  } catch (erro) {
    const detalheErro = paraMensagemErro(erro);

    throw new Error(
      `Contrato RF01 nao atendido: nao foi possivel carregar ${nomeContexto} em ${caminhoModulo}. Implemente este modulo futuro de autenticacao e exporte ${nomeSimbolo}. Detalhe: ${detalheErro}`,
    );
  }
}

function chavesOrdenadas(valor: unknown): string[] {
  if (!ehRegistro(valor)) {
    return [];
  }

  return Object.keys(valor).sort();
}

function esperarRequisicaoPorCaminho(
  controladorHttp: HttpTestingController,
  caminhoEsperado: string,
) {
  return controladorHttp.expectOne(
    (requisicao) => extrairCaminhoUrl(requisicao.url) === caminhoEsperado,
    `requisicao para ${caminhoEsperado}`,
  );
}

function extrairCaminhoUrl(url: string): string {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

function temPropriedadePropria(valor: unknown, chave: string): boolean {
  if (!ehRegistro(valor)) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(valor, chave);
}

function construirPayloadCadastroValido(): PayloadCadastro {
  return {
    name: 'Ana Moni',
    email: 'ana@moni.com',
    password: '12345678',
  };
}

function construirPayloadLoginValido(): PayloadLogin {
  return {
    email: 'ana@moni.com',
    password: '12345678',
  };
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
