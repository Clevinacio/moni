import { Type, ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { readFile } from 'node:fs/promises';
import { Observable, firstValueFrom, of } from 'rxjs';

type PayloadCadastro = Readonly<{
  name: string;
  email: string;
  password: string;
}>;

type PayloadLogin = Readonly<{
  email: string;
  password: string;
}>;

interface ContratoFormulario {
  readonly valid: boolean;
  readonly invalid: boolean;
  patchValue(value: Record<string, unknown>): void;
  get(path: string): AbstractControl | null;
}

interface SuportePaginaCadastro {
  fixture: ComponentFixture<object>;
  componente: unknown;
  chamadasCadastro: Array<Record<string, unknown>>;
  submeter(): Promise<void>;
}

const caminhoModuloPaginaCadastro = './pages/cadastro/cadastro';
const caminhoModuloServicoAutenticacao = './service/servico-autenticacao';
const caminhoTemplatePaginaCadastro = 'src/app/features/auth/pages/cadastro/cadastro.html';

function resolverTemplatePaginaCadastro(url: string): Promise<string> {
  if (url === './cadastro.html') {
    return readFile(caminhoTemplatePaginaCadastro, 'utf-8');
  }
  if (url === './cabecalho-auth.html') {
    return readFile('src/app/features/auth/ui/cabecalho-auth/cabecalho-auth.html', 'utf-8');
  }
  if (url === './input-formulario.html') {
    return readFile('src/app/shared/components/input-formulario/input-formulario.html', 'utf-8');
  }
  if (url === './botao-submit.html') {
    return readFile('src/app/shared/components/botao-submit/botao-submit.html', 'utf-8');
  }

  throw new Error(`Contrato RF01 nao atendido: recurso de template nao mapeado (${url}).`);
}

describe('RF01 - Contrato da PaginaCadastro futura (TDD RED)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('deve expor o componente PaginaCadastro no modulo esperado', async () => {
    const tipoPaginaCadastro = await carregarClasseContrato(
      caminhoModuloPaginaCadastro,
      'PaginaCadastro',
      'PaginaCadastro',
    );

    expect(typeof tipoPaginaCadastro).toBe('function');
  });

  it('deve invalidar cadastro quando campos obrigatorios estiverem vazios', async () => {
    const suporte = await criarSuportePaginaCadastro();
    const formulario = resolverFormulario(suporte.componente, 'PaginaCadastro');

    formulario.patchValue({
      name: '',
      email: '',
      password: '',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('name'), 'required')).toBe(true);
    expect(temErroValidacao(formulario.get('email'), 'required')).toBe(true);
    expect(temErroValidacao(formulario.get('password'), 'required')).toBe(true);
  });

  it('deve invalidar cadastro com e-mail em formato invalido', async () => {
    const suporte = await criarSuportePaginaCadastro();
    const formulario = resolverFormulario(suporte.componente, 'PaginaCadastro');

    formulario.patchValue({
      name: 'Ana',
      email: 'email-invalido',
      password: '12345678',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('email'), 'email')).toBe(true);
  });

  it('deve invalidar cadastro quando senha tiver menos de 8 caracteres', async () => {
    const suporte = await criarSuportePaginaCadastro();
    const formulario = resolverFormulario(suporte.componente, 'PaginaCadastro');

    formulario.patchValue({
      name: 'Ana',
      email: 'ana@moni.com',
      password: '1234567',
    });

    expect(formulario.invalid).toBe(true);
    expect(temErroValidacao(formulario.get('password'), 'minlength')).toBe(true);
  });

  it('deve submeter cadastro apenas com name,email,password e nunca userId', async () => {
    const suporte = await criarSuportePaginaCadastro();
    const formulario = resolverFormulario(suporte.componente, 'PaginaCadastro');

    formulario.patchValue({
      name: 'Ana Moni',
      email: 'ana@moni.com',
      password: '12345678',
    });

    await suporte.submeter();

    expect(suporte.chamadasCadastro.length).toBe(1);

    const primeiraChamada = suporte.chamadasCadastro[0];
    expect(primeiraChamada).toBeDefined();

    if (!primeiraChamada) {
      return;
    }

    expect(primeiraChamada).toEqual({
      name: 'Ana Moni',
      email: 'ana@moni.com',
      password: '12345678',
    });
    expect(Object.keys(primeiraChamada).sort()).toEqual(['email', 'name', 'password']);
    expect(Object.prototype.hasOwnProperty.call(primeiraChamada, 'userId')).toBe(false);
  });
});

async function criarSuportePaginaCadastro(): Promise<SuportePaginaCadastro> {
  const tipoPaginaCadastro = await carregarClasseContrato(
    caminhoModuloPaginaCadastro,
    'PaginaCadastro',
    'PaginaCadastro',
  );
  const tipoServicoAutenticacao = await carregarClasseContrato(
    caminhoModuloServicoAutenticacao,
    'ServicoAutenticacao',
    'ServicoAutenticacao',
  );

  const chamadasCadastro: Array<Record<string, unknown>> = [];

  const stubServicoAutenticacao = {
    cadastrar: (payload: unknown): Observable<unknown> => {
      if (ehRegistro(payload)) {
        chamadasCadastro.push({ ...payload });
      } else {
        chamadasCadastro.push({ __payloadInvalido: payload });
      }

      return of({
        id: 'u-01',
        name: 'Ana Moni',
        email: 'ana@moni.com',
        token: 'jwt-token-valido',
      });
    },
    autenticar: (_payload: PayloadLogin): Observable<unknown> =>
      of({
        token: 'jwt-token-valido',
        type: 'Bearer',
        userId: 'u-01',
      }),
  };

  await resolveComponentResources(resolverTemplatePaginaCadastro);

  TestBed.configureTestingModule({
    imports: [tipoPaginaCadastro],
    providers: [
      {
        provide: tipoServicoAutenticacao,
        useValue: stubServicoAutenticacao,
      },
    ],
  });
  await TestBed.compileComponents();

  const fixture = TestBed.createComponent(tipoPaginaCadastro as Type<object>);
  fixture.detectChanges();

  return {
    fixture,
    componente: fixture.componentInstance as unknown,
    chamadasCadastro,
    submeter: async () => {
      const metodoSubmissao = resolverMetodoEnvio(
        fixture.componentInstance as unknown,
        ['onSubmit', 'submeter', 'cadastrar'],
        'PaginaCadastro',
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

  const nomesPreferenciais = ['formulario', 'formularioCadastro', 'formCadastro', 'form'] as const;

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
    `Contrato RF01 nao atendido: ${nomeContexto} precisa expor um FormGroup com name, email e password.`,
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
    `Contrato RF01 nao atendido: ${nomeContexto} precisa expor um metodo de submit (onSubmit/submeter/cadastrar).`,
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
