import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },
  {
    path: 'inicio',
    loadChildren: () =>
      import('./features/inicial/inicial.routes').then((modulo) => modulo.inicialRoutes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((modulo) => modulo.authRoutes),
  },
  {
    path: 'painel',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/painel/painel').then((modulo) => modulo.PaginaPainel),
  },
  {
    path: 'transacoes',
    loadChildren: () =>
      import('./features/transacoes/transacoes.routes').then((modulo) => modulo.transacoesRoutes),
  },
  {
    path: '**',
    loadChildren: () =>
      import('./features/nao-encontrada/nao-encontrada.routes').then(
        (modulo) => modulo.naoEncontradaRoutes,
      ),
  },
];
