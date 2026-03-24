import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth-guard';

export const inicialRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/inicial/inicial').then((modulo) => modulo.PaginaInicial),
  },
];
