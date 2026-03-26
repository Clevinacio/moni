import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { BotaoSubmitComponent } from '../../../../shared/components/botao-submit/botao-submit';
import { InputFormularioComponent } from '../../../../shared/components/input-formulario/input-formulario';

type FormularioMetaControles = {
  nome: FormControl<string>;
  valorAlvo: FormControl<number>;
};

@Component({
  selector: 'app-formulario-meta',
  imports: [ReactiveFormsModule, InputFormularioComponent, BotaoSubmitComponent],
  templateUrl: './formulario-meta.html',
  styleUrl: './formulario-meta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormularioMeta {
  @Input({ required: true }) formulario!: FormGroup<FormularioMetaControles>;
  @Input() carregando: boolean = false;
  @Input() emEdicao: boolean = false;
  @Output() salvar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  campoInvalido(campo: keyof FormularioMetaControles): 'true' | 'false' {
    const controle = this.formulario.controls[campo];
    return controle.touched && controle.invalid ? 'true' : 'false';
  }

  onSalvar(): void {
    this.salvar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

}
