import { Routes } from '@angular/router';

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
    pathMatch: 'full',
    redirectTo: 'auth/painel',
  },
  {
    path: '**',
    loadChildren: () =>
      import('./features/nao-encontrada/nao-encontrada.routes').then(
        (modulo) => modulo.naoEncontradaRoutes,
      ),
  },
];
