import { Routes } from '@angular/router';

export const metasRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/metas/metas').then((modulo) => modulo.PaginaMetas),
  },
];
