import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';
import { Producto, Inventario } from '../../models/interfaces';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class DashboardComponent implements OnInit {
  // Usando signals para el estado
  productos = signal<Producto[]>([]);
  inventarioBajo = signal<Inventario[]>([]);
  loading = signal(true);
  error = signal('');

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    // Obtener productos
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los productos');
        console.error('Error loading productos', err);
        this.loading.set(false);
      }
    });

    // Obtener inventario bajo
    this.apiService.getInventario().subscribe({
      next: (inventario) => {
        // Filtrar productos con inventario bajo
        this.inventarioBajo.set(
          inventario.filter(item => item.cantidad_actual <= item.minimo_requerido)
        );
      },
      error: (err) => {
        console.error('Error loading inventario', err);
      }
    });
  }
}
