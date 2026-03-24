import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';

export const authTokenInterceptor: HttpInterceptorFn = (requisicao, next) => {
  if (!ehRequisicaoDaApi(requisicao.url, environment.apiUrl)) {
    return next(requisicao);
  }

  const sessaoStorage = inject(SessaoAutenticacaoStorage);
  const token = sessaoStorage.carregar()?.token;

  if (!token) {
    return next(requisicao);
  }

  return next(
    requisicao.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};

function ehRequisicaoDaApi(urlRequisicao: string, apiUrl: string): boolean {
  const baseApi = normalizarUrlAbsoluta(apiUrl);
  if (!baseApi) {
    return false;
  }

  const urlApi = new URL(baseApi);
  const urlRequisicaoNormalizada = normalizarUrlRequisicao(urlRequisicao);

  if (!urlRequisicaoNormalizada) {
    return false;
  }

  const mesmaOrigem =
    urlRequisicaoNormalizada.origin === urlApi.origin || urlRequisicao.startsWith('/');

  if (!mesmaOrigem) {
    return false;
  }

  const caminhoApi = normalizarCaminho(urlApi.pathname);
  const caminhoRequisicao = normalizarCaminho(urlRequisicaoNormalizada.pathname);

  return caminhoRequisicao === caminhoApi || caminhoRequisicao.startsWith(`${caminhoApi}/`);
}

function normalizarUrlAbsoluta(url: string): string | null {
  const urlSemBarraFinal = url.endsWith('/') ? url.slice(0, -1) : url;

  try {
    const urlNormalizada = new URL(urlSemBarraFinal);
    if (urlNormalizada.protocol !== 'http:' && urlNormalizada.protocol !== 'https:') {
      return null;
    }

    return urlSemBarraFinal;
  } catch {
    return null;
  }
}

function normalizarUrlRequisicao(url: string): URL | null {
  try {
    return new URL(url, 'http://localhost');
  } catch {
    return null;
  }
}

function normalizarCaminho(caminho: string): string {
  if (caminho.length > 1 && caminho.endsWith('/')) {
    return caminho.slice(0, -1);
  }

  return caminho;
}
