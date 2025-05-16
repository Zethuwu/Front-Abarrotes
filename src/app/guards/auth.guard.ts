import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

// Angular 17 usa funciones de guardia en lugar de clases
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir al login si no está autenticado
  return router.createUrlTree(['/login']);
};
