import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth-guard';

export const transacoesRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./transacoes/transacoes').then((modulo) => modulo.TransacoesContainer),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/transacoes/transacoes').then((modulo) => modulo.PaginaTransacoes),
      },
    ],
  },
];
