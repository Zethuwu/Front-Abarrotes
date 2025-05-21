import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, catchError} from 'rxjs/operators';
import { of } from 'rxjs';

// Guard para verificar si el usuario está autenticado
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya sabemos que el usuario está autenticado
  if (authService.isAuthenticated()) {
    return true;
  }

  // Intentar verificar si hay una sesión activa
  return authService.getUserInfo().pipe(
    take(1),
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};

// Guard para verificar si el usuario tiene rol ADMIN
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya sabemos que el usuario es admin
  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Intentar verificar si hay una sesión activa y el usuario es admin
  return authService.getUserInfo().pipe(
    take(1),
    map(user => {
      if (user && user.roles.includes('ROLE_ADMIN')) {
        return true;
      } else {
        // Si el usuario está autenticado pero no es admin
        if (authService.isAuthenticated()) {
          router.navigate(['/unauthorized']);
        } else {
          // Si el usuario no está autenticado
          router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
        }
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
};
