import { Routes } from '@angular/router';

export const inicialRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inicial/inicial').then((modulo) => modulo.PaginaInicial),
  },
];
