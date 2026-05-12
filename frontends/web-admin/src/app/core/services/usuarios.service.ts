import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UsuarioDetail } from '../models/usuarios.models';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly base = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getUsuario(usuarioId: string): Observable<UsuarioDetail> {
    return this.http.get<UsuarioDetail>(`${this.base}/usuarios/${usuarioId}`);
  }
}
