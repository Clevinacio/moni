import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';

export const authTokenInterceptor: HttpInterceptorFn = (requisicao, next) => {
  if (!requisicao.url.startsWith('/api/')) {
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
