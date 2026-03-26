import { Directive, ElementRef, HostListener, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appMascaraMoeda]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MascaraMoedaDirective),
      multi: true,
    },
  ],
})
export class MascaraMoedaDirective implements ControlValueAccessor {
  private readonly elemento = inject(ElementRef<HTMLInputElement>);
  private onChange: (valor: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  @HostListener('input', ['$event'])
  onInput(evento: Event): void {
    const alvo = evento.target;
    if (!(alvo instanceof HTMLInputElement)) {
      return;
    }

    const valorBruto = alvo.value;
    const valorNumerico = converterTextoParaNumero(valorBruto);
    const valorFormatado = valorBruto.trim().length === 0 ? '' : formatarMoeda(valorNumerico);

    this.onChange(valorNumerico);
    this.elemento.nativeElement.value = valorFormatado;
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();

    const valorAtual = converterTextoParaNumero(this.elemento.nativeElement.value);

    if (valorAtual > 0) {
      this.elemento.nativeElement.value = formatarMoeda(valorAtual);
      return;
    }

    this.elemento.nativeElement.value = '';
  }

  writeValue(valor: unknown): void {
    if (typeof valor === 'number' && Number.isFinite(valor) && valor > 0) {
      this.elemento.nativeElement.value = formatarMoeda(valor);
      return;
    }

    this.elemento.nativeElement.value = '';
  }

  registerOnChange(fn: (valor: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.elemento.nativeElement.disabled = isDisabled;
  }
}

function converterTextoParaNumero(valor: string): number {
  const apenasDigitos = valor.replace(/\D/g, '');

  if (apenasDigitos.length === 0) {
    return 0;
  }

  const valorCentavos = Number.parseInt(apenasDigitos, 10);
  return valorCentavos / 100;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}