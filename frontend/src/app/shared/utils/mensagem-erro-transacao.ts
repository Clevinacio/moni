import { HttpErrorResponse } from '@angular/common/http';

export function extrairMensagemErroTransacao(erro: unknown, mensagemPadrao: string): string {
  if (erro instanceof HttpErrorResponse) {
    if (ehRegistro(erro.error) && typeof erro.error['mensagem'] === 'string') {
      return erro.error['mensagem'];
    }

    if (typeof erro.message === 'string' && erro.message.trim().length > 0) {
      return erro.message;
    }

    return mensagemPadrao;
  }

  if (erro instanceof Error && erro.message.trim().length > 0) {
    return erro.message;
  }

  return mensagemPadrao;
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}
