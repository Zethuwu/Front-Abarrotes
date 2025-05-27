import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, Usuario } from '../models/interfaces';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private authUrl = `${this.apiUrl}/auth`;
  private isBrowser: boolean;

  public currentUserSignal = signal<Usuario | null>(null);
  public currentUser = computed(() => this.currentUserSignal());
  public isAuthenticated = computed(() => !!this.currentUserSignal());

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.checkSession();
    }
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, credentials, {
      withCredentials: true,
      observe: 'response'
    }).pipe(
      tap(response => {
        this.getUserInfo().subscribe();
      }),
      catchError(error => {
        console.error('Error en login', error);
        return throwError(() => error);
      })
    );
  }

  getUserInfo(): Observable<any> {
    return this.http.get<Usuario>(`${this.authUrl}/user-info`, {
      withCredentials: true
    }).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
      }),
      catchError(error => {
        this.currentUserSignal.set(null);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.authUrl}/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
        return of(null);
      })
    );
  }

  private checkSession(): void {
    this.getUserInfo().subscribe({
      next: () => {
      },
      error: () => {
        if (!this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return !!user?.roles?.includes(role);
  }

  isAdmin(): boolean {
    const user = this.currentUserSignal();
    return !!user?.roles?.includes('ROLE_ADMIN');
  }

}
