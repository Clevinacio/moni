import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Categoria } from '../../../models/transacao.models';

@Injectable({
  providedIn: 'root',
})
export class ServicoCategorias {
  private readonly clienteHttp = inject(HttpClient);
  private readonly prefixoApi = normalizarPrefixoApi(environment.apiUrl);
  private readonly baseUrlCategorias = `${this.prefixoApi}/categories`;

  listar(): Observable<Categoria[]> {
    return this.clienteHttp
      .get<unknown>(this.baseUrlCategorias)
      .pipe(map((resposta) => validarListaCategorias(resposta)));
  }
}

function validarListaCategorias(valor: unknown): Categoria[] {
  if (!Array.isArray(valor)) {
    throw new Error('Resposta de categorias inválida: esperado array.');
  }

  return valor.map((item) => validarCategoria(item));
}

function validarCategoria(valor: unknown): Categoria {
  if (!ehRegistro(valor)) {
    throw new Error('Resposta de categorias inválida: esperado objeto JSON.');
  }

  validarCamposEstritos(valor, ['id', 'nome']);

  const { id, nome } = valor;
  if (!ehTexto(id) || !ehTexto(nome)) {
    throw new Error('Resposta de categorias inválida: campos obrigatórios ausentes ou inválidos.');
  }

  return { id, nome };
}

function validarCamposEstritos(valor: Record<string, unknown>, camposEsperados: readonly string[]): void {
  const chavesAtuais = Object.keys(valor).sort();
  const chavesEsperadas = [...camposEsperados].sort();

  const contratoValido =
    chavesAtuais.length === chavesEsperadas.length &&
    chavesAtuais.every((chave, indice) => chave === chavesEsperadas[indice]);

  if (!contratoValido) {
    throw new Error('Resposta de categorias inválida: formato de campos inesperado.');
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
