import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Meta, PayloadMeta } from '../../../models/meta.models';

@Injectable({
  providedIn: 'root',
})
export class ServicoMetas {
  private readonly clienteHttp = inject(HttpClient);
  private readonly baseUrl = `${normalizarPrefixoApi(environment.apiUrl)}/goals`;

  listar(): Observable<Meta[]> {
    return this.clienteHttp
      .get<unknown>(this.baseUrl)
      .pipe(map((resposta) => validarListaMetas(resposta, 'listagem')));
  }

  criar(payload: PayloadMeta): Observable<Meta> {
    return this.clienteHttp
      .post<unknown>(this.baseUrl, payload)
      .pipe(map((resposta) => validarMeta(resposta, 'criar')));
  }

  atualizar(id: string, payload: PayloadMeta): Observable<Meta> {
    return this.clienteHttp
      .put<unknown>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((resposta) => validarMeta(resposta, 'atualizar')));
  }

  excluir(id: string): Observable<void> {
    return this.clienteHttp.delete<void>(`${this.baseUrl}/${id}`);
  }
}

function validarListaMetas(valor: unknown, contexto: string): Meta[] {
  if (!Array.isArray(valor)) {
    throw new Error(`Resposta de ${contexto} inválida: esperado array de metas.`);
  }

  return valor.map((item) => validarMeta(item, contexto));
}

function validarMeta(valor: unknown, contexto: string): Meta {
  if (!ehRegistro(valor)) {
    throw new Error(`Resposta de ${contexto} inválida: esperado objeto JSON.`);
  }

  validarCamposEstritos(valor, ['id', 'nome', 'valorAlvo', 'valorPoupado'], contexto);

  const { id, nome, valorAlvo, valorPoupado } = valor;

  if (!ehTexto(id) || !ehTexto(nome) || !ehNumero(valorAlvo) || !ehNumero(valorPoupado)) {
    throw new Error(`Resposta de ${contexto} inválida: campos obrigatórios ausentes ou inválidos.`);
  }

  return {
    id,
    nome,
    valorAlvo,
    valorPoupado,
  };
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

function ehNumero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
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
