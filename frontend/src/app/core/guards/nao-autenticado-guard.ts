import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';

export const naoAutenticadoGuard: CanActivateFn = () => {
  const sessaoStorage = inject(SessaoAutenticacaoStorage);
  const roteador = inject(Router);

  if (sessaoStorage.carregar()?.token) {
    return roteador.createUrlTree(['/painel']);
  }

  return true;
};
