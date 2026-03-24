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
    throw new Error('Resposta de cadastro inválida: esperado objeto JSON.');
  }

  validarCamposEstritos(valor, ['id', 'name', 'email', 'token'], 'cadastro');

  const { id, name, email, token } = valor;

  if (!ehTexto(id) || !ehTexto(name) || !ehTexto(email) || !ehTexto(token)) {
    throw new Error('Resposta de cadastro inválida: campos obrigatórios ausentes ou inválidos.');
  }

  return { id, name, email, token };
}

function validarRespostaLogin(valor: unknown): RespostaLogin {
  if (!ehRegistro(valor)) {
    throw new Error('Resposta de autenticação inválida: esperado objeto JSON.');
  }

  validarCamposEstritos(valor, ['token', 'type', 'userId', 'name'], 'autenticação');

  const { token, type, userId, name } = valor;

  if (!ehTexto(token) || !ehTexto(type) || !ehTexto(userId) || !ehTexto(name)) {
    throw new Error(
      'Resposta de autenticação inválida: campos obrigatórios ausentes ou inválidos.',
    );
  }

  return { token, type, userId, name };
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
    throw new Error(`Resposta de ${contexto} inválida: formato de campos inesperado.`);
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
    const url = new URL(urlSemBarraFinal);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('protocolo inválido');
    }

    return urlSemBarraFinal;
  } catch {
    throw new Error('Configuração inválida: environment.apiUrl deve ser uma URL absoluta.');
  }
}
