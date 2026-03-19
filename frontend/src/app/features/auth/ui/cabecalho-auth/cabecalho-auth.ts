import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-cabecalho-auth',
  imports: [],
  templateUrl: './cabecalho-auth.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabecalhoAuthComponent {
  @Input() identificadorTitulo: string = '';
  @Input() titulo: string = '';
  @Input() descricao: string = '';
}
