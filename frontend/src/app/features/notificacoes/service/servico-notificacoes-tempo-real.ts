import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Notificacao } from '../../../models/notificacao.models';

@Injectable({
  providedIn: 'root',
})
export class ServicoNotificacoesTempoReal {
  private cliente: Client | null = null;
  private readonly notificacoesSubject = new Subject<Notificacao>();

  readonly notificacoes$: Observable<Notificacao> = this.notificacoesSubject.asObservable();

  conectar(token: string): void {
    if (!token || this.cliente?.active) {
      return;
    }

    this.cliente = new Client({
      brokerURL: normalizarUrlWebsocket(environment.websocketUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.cliente?.subscribe('/user/queue/notificacoes', (mensagem) => {
          this.processarMensagem(mensagem);
        });
      },
    });

    this.cliente.activate();
  }

  desconectar(): void {
    if (!this.cliente) {
      return;
    }

    this.cliente.deactivate();
    this.cliente = null;
  }

  private processarMensagem(mensagem: IMessage): void {
    try {
      const conteudo = JSON.parse(mensagem.body) as unknown;
      const notificacao = validarNotificacao(conteudo);
      this.notificacoesSubject.next(notificacao);
    } catch {
      // Ignora mensagens invalidas para nao quebrar o stream de notificacoes.
    }
  }
}

function normalizarUrlWebsocket(url: string): string {
  if (url.startsWith('ws://') || url.startsWith('wss://')) {
    return url;
  }

  if (url.startsWith('https://')) {
    return `wss://${url.slice('https://'.length)}`;
  }

  if (url.startsWith('http://')) {
    return `ws://${url.slice('http://'.length)}`;
  }

  throw new Error('Configuracao invalida: environment.websocketUrl deve ser URL absoluta HTTP(S) ou WS(S).');
}

function validarNotificacao(valor: unknown): Notificacao {
  if (!ehRegistro(valor)) {
    throw new Error('Mensagem de notificacao invalida.');
  }

  const { id, mensagem, tipo, lida, criadaEm } = valor;

  if (!ehTexto(id) || !ehTexto(mensagem) || !ehTexto(tipo) || typeof lida !== 'boolean' || !ehTexto(criadaEm)) {
    throw new Error('Mensagem de notificacao invalida.');
  }

  return {
    id,
    mensagem,
    tipo,
    lida,
    criadaEm,
  };
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}
