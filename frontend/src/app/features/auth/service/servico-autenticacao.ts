import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  PayloadCadastro,
  PayloadLogin,
  RespostaCadastro,
  RespostaLogin,
} from '../../../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class ServicoAutenticacao {
  private readonly clienteHttp = inject(HttpClient);
  private readonly prefixoApi = normalizarPrefixoApi(environment.apiUrl);
  private readonly baseUrlAuth = `${this.prefixoApi}/auth`;

  cadastrar(payload: PayloadCadastro): Observable<RespostaCadastro> {
    const corpoRequisicao: PayloadCadastro = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    };

    return this.clienteHttp
      .post<unknown>(`${this.baseUrlAuth}/register`, corpoRequisicao)
      .pipe(map((resposta) => validarRespostaCadastro(resposta)));
  }

  autenticar(payload: PayloadLogin): Observable<RespostaLogin> {
    const corpoRequisicao: PayloadLogin = {
      email: payload.email,
      password: payload.password,
    };

    return this.clienteHttp
      .post<unknown>(`${this.baseUrlAuth}/login`, corpoRequisicao)
      .pipe(map((resposta) => validarRespostaLogin(resposta)));
  }
}

function validarRespostaCadastro(valor: unknown): RespostaCadastro {
  if (!ehRegistro(valor)) {
    throw new Error('Resposta de cadastro invalida: esperado objeto JSON.');
  }

  validarCamposEstritos(valor, ['id', 'name', 'email', 'token'], 'cadastro');

  const { id, name, email, token } = valor;

  if (!ehTexto(id) || !ehTexto(name) || !ehTexto(email) || !ehTexto(token)) {
    throw new Error('Resposta de cadastro invalida: campos obrigatorios ausentes ou invalidos.');
  }

  return { id, name, email, token };
}

function validarRespostaLogin(valor: unknown): RespostaLogin {
  if (!ehRegistro(valor)) {
    throw new Error('Resposta de autenticacao invalida: esperado objeto JSON.');
  }

  validarCamposEstritos(valor, ['token', 'type', 'userId'], 'autenticacao');

  const { token, type, userId } = valor;

  if (!ehTexto(token) || !ehTexto(type) || !ehTexto(userId)) {
    throw new Error(
      'Resposta de autenticacao invalida: campos obrigatorios ausentes ou invalidos.',
    );
  }

  return { token, type, userId };
}

function validarCamposEstritos(
  valor: Record<string, unknown>,
  camposEsperados: readonly string[],
  contexto: string,
): void {
  const chavesAtuais = Object.keys(valor).sort();
  const chavesEsperadas = [...camposEsperados].sort();

  const contratoValido =
    chavesAtuais.length === chavesEsperadas.length &&
    chavesAtuais.every((chave, indice) => chave === chavesEsperadas[indice]);

  if (!contratoValido) {
    throw new Error(`Resposta de ${contexto} invalida: formato de campos inesperado.`);
  }
}

function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function normalizarPrefixoApi(apiUrl: string): string {
  const urlSemBarraFinal = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

  try {
    // Se consegue fazer parse, é uma URL absoluta com schema + host
    // Retorna a URL completa para funcionar em qualquer ambiente
    new URL(urlSemBarraFinal);
    return urlSemBarraFinal;
  } catch {
    // Se não conseguir fazer parse, trata como path relativo
    if (urlSemBarraFinal.startsWith('/')) {
      return urlSemBarraFinal;
    }

    return `/${urlSemBarraFinal}`;
  }
}
