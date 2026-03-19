import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-botao-submit',
  imports: [],
  templateUrl: './botao-submit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotaoSubmitComponent {
  @Input() carregando: boolean = false;
  @Input({ required: true }) rotuloPadrao!: string;
  @Input() rotuloCarregando: string = 'Aguarde...';
  @Input() desabilitado: boolean = false;
}
