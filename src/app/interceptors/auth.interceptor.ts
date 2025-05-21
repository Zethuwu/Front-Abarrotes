import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { throwError } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Asegurarse de que todas las peticiones incluyan cookies de sesión
    // Esto es fundamental para mantener la autenticación basada en sesiones
    const authReq = request.clone({
      withCredentials: true
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Manejar errores de autenticación (401) y autorización (403)
        if (error.status === 401) {
          // No manejar errores 401 en endpoints de login
          if (!request.url.includes('/auth/login')) {
            // Limpiar estado de autenticación y redirigir a login
            this.authService.getUserInfo().subscribe({
              error: () => {
                // Solo redirigir si hay error en userInfo (sesión expirada)
                this.router.navigate(['/login'], {
                  queryParams: { returnUrl: this.router.url }
                });
              }
            });
          }
        }

        // Para errores 403 (Prohibido), redirigir a página de no autorizado
        else if (error.status === 403) {
          this.router.navigate(['/unauthorized']);
        }

        return throwError(() => error);
      })
    );
  }
}
