import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Fatura, FaturaPayload } from '../../../models/fatura.models';

@Injectable({
  providedIn: 'root'
})
export class ServicoFaturas {
  private http = inject(HttpClient);
  private urlBase = '/api/v1/bills';

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
