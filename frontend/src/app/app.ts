import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PreferenciaUiStore } from './store/preferencia-ui/preferencia-ui-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly preferenciaUiStore = inject(PreferenciaUiStore);

  constructor() {
    this.preferenciaUiStore.inicializarTema();
    this.preferenciaUiStore.sincronizarTemaComSistema();
  }
}
