// src/app/services/token-storage.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get token(): string | null {
    return localStorage.getItem('token');
  }
  clear(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
