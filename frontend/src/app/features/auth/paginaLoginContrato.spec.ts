import { Type, ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { readFile } from 'node:fs/promises';
import { Observable, firstValueFrom, of } from 'rxjs';

type PayloadLogin = Readonly<{
  email: string;
  password: string;
}>;

type PayloadCadastro = Readonly<{
  name: string;
  email: string;
  password: string;
}>;

interface ContratoFormulario {
  readonly valid: boolean;
  readonly invalid: boolean;
  patchValue(value: Record<string, unknown>): void;
  get(path: string): AbstractControl | null;
}

interface SuportePaginaLogin {
  fixture: ComponentFixture<object>;
  componente: unknown;
  chamadasAutenticacao: Array<Record<string, unknown>>;
  submeter(): Promise<void>;
}

const caminhoModuloPaginaLogin = './pages/login/login';
const caminhoModuloServicoAutenticacao = './service/servico-autenticacao';
const caminhoTemplatePaginaLogin = 'src/app/features/auth/pages/login/login.html';

function resolverTemplatePaginaLogin(url: string): Promise<string> {
  if (url === './login.html') {
    return readFile(caminhoTemplatePaginaLogin, 'utf-8');
  }

  throw new Error(`Contrato RF01 nao atendido: recurso de template nao mapeado (${url}).`);
}

describe('RF01 - Contrato da PaginaLogin futura (TDD RED)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve expor o componente PaginaLogin no modulo esperado', async () => {
    const tipoPaginaLogin = await carregarClasseContrato(
      caminhoModuloPaginaLogin,
      'PaginaLogin',
      'PaginaLogin',
    );

    expect(typeof tipoPaginaLogin).toBe('function');
  });

  it('deve invalidar login quando campos obrigatorios estiverem vazios', async () => {
    const suporte = await criarSuportePaginaLogin();
    const formulario = resolverFormulario(suporte.componente, 'PaginaLogin');

    formulario.patchValue({
      email: '',
      password: '',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('email'), 'required')).toBe(true);
    expect(temErroValidacao(formulario.get('password'), 'required')).toBe(true);
  });

  it('deve invalidar login com e-mail em formato invalido', async () => {
    const suporte = await criarSuportePaginaLogin();
    const formulario = resolverFormulario(suporte.componente, 'PaginaLogin');

    formulario.patchValue({
      email: 'email-invalido',
      password: '12345678',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('email'), 'email')).toBe(true);
  });

  it('deve invalidar login quando senha tiver menos de 8 caracteres', async () => {
    const suporte = await criarSuportePaginaLogin();
    const formulario = resolverFormulario(suporte.componente, 'PaginaLogin');

    formulario.patchValue({
      email: 'ana@moni.com',
      password: '1234567',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('password'), 'minlength')).toBe(true);
  });

  it('deve submeter login apenas com email,password e nunca userId', async () => {
    const suporte = await criarSuportePaginaLogin();
    const formulario = resolverFormulario(suporte.componente, 'PaginaLogin');

    formulario.patchValue({
      email: 'ana@moni.com',
      password: '12345678',
    });

    await suporte.submeter();

    expect(suporte.chamadasAutenticacao.length).toBe(1);

    const primeiraChamada = suporte.chamadasAutenticacao[0];
    expect(primeiraChamada).toBeDefined();

    if (!primeiraChamada) {
      return;
    }

    expect(primeiraChamada).toEqual({
      email: 'ana@moni.com',
      password: '12345678',
    });
    expect(Object.keys(primeiraChamada).sort()).toEqual(['email', 'password']);
    expect(Object.prototype.hasOwnProperty.call(primeiraChamada, 'userId')).toBe(false);
  });
});

async function criarSuportePaginaLogin(): Promise<SuportePaginaLogin> {
  const tipoPaginaLogin = await carregarClasseContrato(
    caminhoModuloPaginaLogin,
    'PaginaLogin',
    'PaginaLogin',
  );
  const tipoServicoAutenticacao = await carregarClasseContrato(
    caminhoModuloServicoAutenticacao,
    'ServicoAutenticacao',
    'ServicoAutenticacao',
  );

  const chamadasAutenticacao: Array<Record<string, unknown>> = [];

  const stubServicoAutenticacao = {
    autenticar: (payload: unknown): Observable<unknown> => {
      if (ehRegistro(payload)) {
        chamadasAutenticacao.push({ ...payload });
      } else {
        chamadasAutenticacao.push({ __payloadInvalido: payload });
      }

      return of({
        token: 'jwt-token-valido',
        type: 'Bearer',
        userId: 'u-01',
      });
    },
    cadastrar: (_payload: PayloadCadastro): Observable<unknown> =>
      of({
        id: 'u-01',
        name: 'Ana',
        email: 'ana@moni.com',
        token: 'jwt-token-valido',
      }),
  };

  await resolveComponentResources(resolverTemplatePaginaLogin);

  TestBed.configureTestingModule({
    imports: [tipoPaginaLogin],
    providers: [
      {
        provide: tipoServicoAutenticacao,
        useValue: stubServicoAutenticacao,
      },
    ],
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(tipoPaginaLogin as Type<object>);
  fixture.detectChanges();

  return {
    fixture,
    componente: fixture.componentInstance as unknown,
    chamadasAutenticacao,
    submeter: async () => {
      const metodoSubmissao = resolverMetodoEnvio(
        fixture.componentInstance as unknown,
        ['onSubmit', 'submeter', 'autenticar', 'entrar'],
        'PaginaLogin',
      );

      const resultado = metodoSubmissao();
      await aguardarResultadoPossivelmenteAssincrono(resultado);
      fixture.detectChanges();
      await fixture.whenStable();
    },
  };
}

function resolverFormulario(componente: unknown, nomeContexto: string): ContratoFormulario {
  if (!ehRegistro(componente)) {
    throw new Error(
      `Contrato RF01 nao atendido: ${nomeContexto} precisa ser um objeto de componente.`,
    );
  }

  const nomesPreferenciais = ['formulario', 'formularioLogin', 'formLogin', 'form'] as const;

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
    `Contrato RF01 nao atendido: ${nomeContexto} precisa expor um FormGroup com email e password.`,
  );
}

function resolverMetodoEnvio(
  componente: unknown,
  nomesCandidatos: readonly string[],
  nomeContexto: string,
): () => unknown {
  if (!ehRegistro(componente)) {
    throw new Error(
      `Contrato RF01 nao atendido: ${nomeContexto} precisa ser um objeto de componente.`,
    );
  }

  for (const nomeMetodo of nomesCandidatos) {
    const candidato = Reflect.get(componente, nomeMetodo);

    if (typeof candidato === 'function') {
      return () => candidato.call(componente);
    }
  }

  throw new Error(
    `Contrato RF01 nao atendido: ${nomeContexto} precisa expor um metodo de submit (onSubmit/submeter/autenticar/entrar).`,
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
      `Contrato RF01 nao atendido: nao foi possivel carregar ${nomeContexto} em ${caminhoModulo}. Crie o modulo futuro e exporte ${nomeSimbolo}. Detalhe: ${detalhes}`,
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
