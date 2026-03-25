import { Routes } from '@angular/router';

export const transacoesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/transacoes/transacoes').then((modulo) => modulo.PaginaTransacoes),
  },
];
