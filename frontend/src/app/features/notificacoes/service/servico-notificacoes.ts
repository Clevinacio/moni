import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Notificacao } from '../../../models/notificacao.models';

@Injectable({
  providedIn: 'root',
})
export class ServicoNotificacoes {
  private readonly clienteHttp = inject(HttpClient);
  private readonly baseUrl = `${normalizarPrefixoApi(environment.apiUrl)}/notifications`;

  listar(): Observable<Notificacao[]> {
    return this.clienteHttp
      .get<unknown>(this.baseUrl)
      .pipe(map((resposta) => validarListaNotificacoes(resposta, 'listagem')));
  }

  limpar(): Observable<void> {
    return this.clienteHttp.delete<void>(this.baseUrl);
  }
}

function validarListaNotificacoes(valor: unknown, contexto: string): Notificacao[] {
  if (!Array.isArray(valor)) {
    throw new Error(`Resposta de ${contexto} invalida: esperado array de notificacoes.`);
  }

  return valor.map((item) => validarNotificacao(item, contexto));
}

function validarNotificacao(valor: unknown, contexto: string): Notificacao {
  if (!ehRegistro(valor)) {
    throw new Error(`Resposta de ${contexto} invalida: esperado objeto JSON.`);
  }

  validarCamposEstritos(valor, ['id', 'mensagem', 'tipo', 'lida', 'criadaEm'], contexto);

  const { id, mensagem, tipo, lida, criadaEm } = valor;

  if (!ehTexto(id) || !ehTexto(mensagem) || !ehTexto(tipo) || typeof lida !== 'boolean' || !ehTexto(criadaEm)) {
    throw new Error(`Resposta de ${contexto} invalida: campos obrigatorios ausentes ou invalidos.`);
  }

  return {
    id,
    mensagem,
    tipo,
    lida,
    criadaEm,
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
    const url = new URL(urlSemBarraFinal);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('protocolo invalido');
    }

    return urlSemBarraFinal;
  } catch {
    throw new Error('Configuracao invalida: environment.apiUrl deve ser uma URL absoluta.');
  }
}