import { Routes } from '@angular/router';

export const naoEncontradaRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/nao-encontrada/nao-encontrada').then((modulo) => modulo.PaginaNaoEncontrada),
  },
];
