import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';

export const authGuard: CanActivateFn = () => {
  const sessaoStorage = inject(SessaoAutenticacaoStorage);
  const roteador = inject(Router);

  if (sessaoStorage.carregar()?.token) {
    return true;
  }

  return roteador.createUrlTree(['/auth/login']);
};
