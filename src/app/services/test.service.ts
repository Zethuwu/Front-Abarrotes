// test.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class TestService {
  constructor(private http: HttpClient) {} // ← Inyectar aquí
}
