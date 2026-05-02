import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SessaoAutenticacaoStorage } from '../../features/auth/service/sessao-autenticacao-storage';

@Component({
  selector: 'app-root-redirect',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RootRedirectComponent implements OnInit {
  private readonly sessaoStorage = inject(SessaoAutenticacaoStorage);
  private readonly roteador = inject(Router);

  ngOnInit(): void {
    const destino = this.sessaoStorage.carregar()?.token ? '/painel' : '/auth/login';
    void this.roteador.navigateByUrl(destino, { replaceUrl: true });
  }
}
