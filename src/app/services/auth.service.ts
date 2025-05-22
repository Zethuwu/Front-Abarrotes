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
      // Al iniciar el servicio, verificar si hay una sesión activa
      this.checkSession();
    }
  }

  /**
   * Realiza login con credenciales y mantiene la sesión
   */
  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, credentials, {
      withCredentials: true, // Importante: permitir cookies
      observe: 'response' // Para acceder a las cabeceras de respuesta
    }).pipe(
      tap(response => {
        // Después de iniciar sesión, obtener la información del usuario
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
      withCredentials: true // Importante: enviar cookies
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
        // En caso de error, igualmente limpiamos datos locales
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
        return of(null); // No propagamos el error
      })
    );
  }

  /**
   * Verifica si hay una sesión activa al cargar la aplicación
   */
  private checkSession(): void {
    this.getUserInfo().subscribe({
      next: () => {
        // Sesión válida, no hacemos nada adicional
      },
      error: () => {
        // Sin sesión válida, redirigir al login si no estamos ya allí
        if (!this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSignal();
    return !!user?.roles?.includes(role);
  }

  /**
   * Verifica si el usuario es administrador
   */
  isAdmin(): boolean {
    const user = this.currentUserSignal();
    return !!user?.roles?.includes('ROLE_ADMIN');
  }

}
