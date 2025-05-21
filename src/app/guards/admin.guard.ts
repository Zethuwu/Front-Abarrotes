import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/interfaces';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.hasRole(Rol.ADMIN)) {
    return true;
  }

  return router.createUrlTree(['/forbidden']); // o ['/login']
};
