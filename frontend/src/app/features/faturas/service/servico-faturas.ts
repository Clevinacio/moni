import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Fatura, FaturaPayload } from '../../../models/fatura.models';

@Injectable({
  providedIn: 'root',
})
export class ServicoFaturas {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${normalizarPrefixoApi(environment.apiUrl)}/bills`;

  listar(): Observable<Fatura[]> {
    return this.http.get<Fatura[]>(this.urlBase);
  }

  criar(payload: FaturaPayload): Observable<Fatura> {
    return this.http.post<Fatura>(this.urlBase, payload);
  }

  pagar(id: string): Observable<Fatura> {
    return this.http.patch<Fatura>(`${this.urlBase}/${id}/pay`, {});
  }
}

function normalizarPrefixoApi(apiUrl: string): string {
  const urlSemBarraFinal = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

  if (!urlSemBarraFinal.endsWith('/api/v1')) {
    throw new Error('Configuracao invalida: environment.apiUrl deve terminar com /api/v1.');
  }

  try {
    const url = new URL(urlSemBarraFinal);
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error('Configuracao invalida: environment.apiUrl deve ser uma URL absoluta.');
  }
}
