import { Routes } from '@angular/router';

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
        pathMatch: 'full',
        redirectTo: '/painel',
      },
    ],
  },
];
