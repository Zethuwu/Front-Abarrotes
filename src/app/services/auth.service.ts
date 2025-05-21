import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, Rol, Usuario } from '../models/interfaces';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}`;
  private isBrowser: boolean;

  private currentUserSignal = signal<Usuario | null>(null);
  public currentUser = computed(() => this.currentUserSignal());
  public isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(user => {
        if (this.isBrowser) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.currentUserSignal.set(user);
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('user');
    }
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return null; // no usamos token todavía
  }


  hasRole(role: Rol): boolean {
  const user = this.currentUserSignal();
  return user?.roles?.includes(role) ?? false;
}
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSignal.set(user);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
        this.logout();
      }
    }
  }
}
