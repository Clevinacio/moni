import { Routes } from '@angular/router';

import { naoAutenticadoGuard } from '../../core/guards/nao-autenticado-guard';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth').then((modulo) => modulo.AuthContainer),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
      {
        path: 'login',
        canActivate: [naoAutenticadoGuard],
        loadComponent: () => import('./pages/login/login').then((modulo) => modulo.PaginaLogin),
      },
      {
        path: 'cadastro',
        loadComponent: () =>
          import('./pages/cadastro/cadastro').then((modulo) => modulo.PaginaCadastro),
      },
      {
        path: 'painel',
        pathMatch: 'full',
        redirectTo: '/painel',
      },
    ],
  },
];
