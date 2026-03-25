import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  FiltrosTransacao,
  PayloadTransacao,
  TipoTransacao,
  Transacao,
} from '../../../models/transacao.models';

@Injectable({
  providedIn: 'root',
})
export class ServicoTransacoes {
  private readonly clienteHttp = inject(HttpClient);
  private readonly prefixoApi = normalizarPrefixoApi(environment.apiUrl);
  private readonly baseUrlTransacoes = `${this.prefixoApi}/transactions`;

  listar(filtros?: FiltrosTransacao): Observable<Transacao[]> {
    return this.clienteHttp
      .get<unknown>(this.baseUrlTransacoes, {
        params: construirParamsFiltros(filtros),
      })
      .pipe(map((resposta) => validarListaTransacoes(resposta)));
  }

  criar(payload: PayloadTransacao): Observable<Transacao> {
    const corpoRequisicao = normalizarPayload(payload);

    return this.clienteHttp
      .post<unknown>(this.baseUrlTransacoes, corpoRequisicao)
      .pipe(map((resposta) => validarTransacao(resposta, 'criar')));
  }

  atualizar(id: string, payload: PayloadTransacao): Observable<Transacao> {
    const corpoRequisicao = normalizarPayload(payload);

    return this.clienteHttp
      .put<unknown>(`${this.baseUrlTransacoes}/${id}`, corpoRequisicao)
      .pipe(map((resposta) => validarTransacao(resposta, 'atualizar')));
  }

  excluir(id: string): Observable<void> {
    return this.clienteHttp.delete<void>(`${this.baseUrlTransacoes}/${id}`);
  }
}

function normalizarPayload(payload: PayloadTransacao): PayloadTransacao {
  const categoria = payload.categoria.id
    ? { id: payload.categoria.id }
    : { nome: payload.categoria.nome };

  return {
    descricao: payload.descricao,
    valor: payload.valor,
    data: payload.data,
    tipo: payload.tipo,
    categoria,
  };
}

function construirParamsFiltros(filtros?: FiltrosTransacao): HttpParams {
  let params = new HttpParams();

  if (!filtros) {
    return params;
  }

  if (filtros.categoriaId) {
    params = params.set('categoriaId', filtros.categoriaId);
  }

  if (filtros.dataInicio && filtros.dataFim) {
    return params.set('dataInicio', filtros.dataInicio).set('dataFim', filtros.dataFim);
  }

  if (typeof filtros.mes === 'number' && typeof filtros.ano === 'number') {
    return params.set('mes', String(filtros.mes)).set('ano', String(filtros.ano));
  }

  return params;
}

function validarListaTransacoes(valor: unknown): Transacao[] {
  if (!Array.isArray(valor)) {
    throw new Error('Resposta de listagem inválida: esperado array de transações.');
  }

  return valor.map((item) => validarTransacao(item, 'listagem'));
}

function validarTransacao(valor: unknown, contexto: string): Transacao {
  if (!ehRegistro(valor)) {
    throw new Error(`Resposta de ${contexto} inválida: esperado objeto JSON.`);
  }

  validarCamposEstritos(valor, ['id', 'descricao', 'valor', 'data', 'tipo', 'categoria'], contexto);

  const { id, descricao, valor: valorTransacao, data, tipo, categoria } = valor;

  if (
    !ehTexto(id) ||
    !ehTexto(descricao) ||
    !ehNumero(valorTransacao) ||
    !ehTexto(data) ||
    !ehTipoTransacao(tipo) ||
    !ehTexto(categoria)
  ) {
    throw new Error(`Resposta de ${contexto} inválida: campos obrigatórios ausentes ou inválidos.`);
  }

  return {
    id,
    descricao,
    valor: valorTransacao,
    data,
    tipo,
    categoria,
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

function ehTipoTransacao(valor: unknown): valor is TipoTransacao {
  return valor === 'RECEITA' || valor === 'DESPESA';
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
