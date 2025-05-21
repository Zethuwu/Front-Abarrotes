import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card border-danger">
            <div class="card-header bg-danger text-white">
              <h4>Acceso no autorizado</h4>
            </div>
            <div class="card-body">
              <div class="text-center mb-4">
                <i class="bi bi-shield-lock" style="font-size: 3rem;"></i>
              </div>
              <h5 class="card-title">No tienes permisos para acceder a esta sección</h5>
              <p class="card-text">
                Lo sentimos, no tienes los permisos necesarios para acceder a esta página.
                Si crees que esto es un error, por favor contacta al administrador.
              </p>
              <div class="text-center mt-4">
                <a routerLink="/dashboard" class="btn btn-primary">
                  Volver al inicio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UnauthorizedComponent { }
