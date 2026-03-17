import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth-guard';

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
        loadComponent: () => import('./pages/login/login').then((modulo) => modulo.PaginaLogin),
      },
      {
        path: 'cadastro',
        loadComponent: () =>
          import('./pages/cadastro/cadastro').then((modulo) => modulo.PaginaCadastro),
      },
      {
        path: 'painel',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/painel/painel').then((modulo) => modulo.PaginaPainel),
      },
    ],
  },
];
