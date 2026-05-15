import { Routes } from '@angular/router';
import { PaginaFaturas } from './pages/faturas/faturas';
import { authGuard } from '../../core/guards/auth-guard';

export const FATURAS_ROUTES: Routes = [
  {
    path: '',
    component: PaginaFaturas,
    canActivate: [authGuard]
  }
];
