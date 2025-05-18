import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';
import { Producto, Proveedor, InventarioDTO } from '../../models/interfaces';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class InventarioComponent implements OnInit {
  productos = signal<Producto[]>([]);
  proveedores = signal<Proveedor[]>([]);
  loading = signal(true);
  error = signal('');

  productoForm: FormGroup;
  editingProducto = signal<Producto | null>(null);
  showForm = signal(false);

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
        this.productoForm = this.fb.group({
          nombre: ['', [Validators.required]],
          descripcion: ['', [Validators.required]],
          precio: [0, [Validators.required, Validators.min(0)]],
          imagenUrl: [''],
          status: ['CREADO_CORRECTAMENTE'],
          proveedorId: [null, [Validators.required]],
          inventarioDTO: this.fb.group({
            cantidadActual: [0, [Validators.required, Validators.min(0)]],
            cantidadInicial: [0, [Validators.required, Validators.min(0)]],
            minimoRequerido: [0, [Validators.required, Validators.min(0)]]
          })
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
  this.loading.set(true);

  this.apiService.getProductos().subscribe({
    next: (productos) => {
      this.productos.set(productos);

      // Obtener IDs únicos de proveedores
      const proveedorIds = Array.from(new Set(productos.map(p => p.proveedorId)));

      const proveedoresCargados: Proveedor[] = [];
      let pendientes = proveedorIds.length;

      if (pendientes === 0) {
        this.loading.set(false);
        return;
      }

      proveedorIds.forEach(id => {
        this.apiService.getProveedor(id).subscribe({
          next: (proveedor) => {
            proveedoresCargados.push(proveedor);
          },
          error: (err) => {
            console.error(`Error al cargar proveedor ID ${id}`, err);
          },
          complete: () => {
            pendientes--;
            if (pendientes === 0) {
              this.proveedores.set(proveedoresCargados);
              this.loading.set(false);
            }
          }
        });
      });
    },
    error: (err) => {
      this.error.set('Error al cargar los productos');
      console.error('Error loading productos', err);
      this.loading.set(false);
    }
  });
}

  getNombreProveedor(proveedorId: number): string {
  const proveedor = this.proveedores().find(p => p.id === proveedorId);
  return proveedor ? proveedor.nombre : 'Cargando...';
}

  deleteProducto(id: number): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.apiService.deleteProducto(id).subscribe({
        next: () => {
          // Eliminar de la lista de productos
          this.productos.set(this.productos().filter(p => p.id !== id));
        },
        error: (err) => {
          console.error('Error deleting producto', err);
          this.error.set('Error al eliminar el producto');
        }
      });
    }
  }
}
