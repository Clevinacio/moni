import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';

import { MascaraMoedaDirective } from '../../directives/mascara-moeda.directive';

@Component({
  selector: 'app-input-formulario',
  imports: [ReactiveFormsModule, MascaraMoedaDirective],
  templateUrl: './input-formulario.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFormularioComponent implements OnChanges {
  @Input({ required: true }) id!: string;
  @Input({ required: true }) rotulo!: string;
  @Input() tipo: string = 'text';
  @Input() autocomplete: string = 'off';
  @Input() ajuda: string = '';
  @Input() mascaraMoeda: boolean = false;
  @Input() invalido: 'true' | 'false' = 'false';
  @Input({ required: true }) controle!: AbstractControl;
  @Input() mensagensErro: Record<string, string> = {};

  errosAtivos: Array<{ validacao: string; mensagem: string }> = [];

  ngOnChanges(): void {
    this.atualizarErros();
  }

  tipoInput(): string {
    return this.mascaraMoeda ? 'text' : this.tipo;
  }

  private atualizarErros(): void {
    if (!this.controle?.touched) {
      this.errosAtivos = [];
      return;
    }

    this.errosAtivos = Object.entries(this.mensagensErro)
      .filter(([validacao]) => this.controle.hasError(validacao))
      .map(([validacao, mensagem]) => ({ validacao, mensagem: mensagem as string }));
  }
}
