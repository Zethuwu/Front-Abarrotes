import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';
import { Producto, Proveedor } from '../../models/interfaces';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['productos.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class ProductosComponent implements OnInit {
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

    // Cargar productos
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

    // Cargar proveedores para el formulario
    this.apiService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores.set(proveedores);
      },
      error: (err) => {
        console.error('Error loading proveedores', err);
      }
    });
  }

  openForm(producto?: Producto): void {
  if (producto) {
    this.editingProducto.set(producto);
    this.productoForm.patchValue({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagenUrl: producto.imagen_url,
      proveedorId: producto.proveedorId,
      inventarioDTO: {
        cantidadActual: producto.inventario?.cantidad_actual ?? 0,
        cantidadInicial: producto.inventario?.cantidad_inicial ?? 0,
        minimoRequerido: producto.inventario?.minimo_requerido ?? 0
      }
    });
  } else {
    this.editingProducto.set(null);
    this.productoForm.reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      imagenUrl: '',
      proveedor_id: null,
      inventarioDTO: {
        cantidadActual: 0,
        cantidadInicial: 0,
        minimoRequerido: 0
      }
    });
  }

  this.showForm.set(true);
}


  closeForm(): void {
    this.showForm.set(false);
    this.productoForm.reset();
    this.editingProducto.set(null);
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
      return;
    }

    const productoData = this.productoForm.value;

    if (this.editingProducto()) {
      // Actualizar producto existente
      this.apiService.updateProducto(this.editingProducto()!.id, productoData).subscribe({
        next: (updatedProducto) => {
          // Actualizar la lista de productos
          const updatedProductos = this.productos().map(p =>
            p.id === updatedProducto.id ? updatedProducto : p
          );
          this.productos.set(updatedProductos);
          this.closeForm();
        },
        error: (err) => {
          console.error('Error updating producto', err);
          this.error.set('Error al actualizar el producto');
        }
      });
    } else {
      // Crear nuevo producto
      this.apiService.createProducto(productoData).subscribe({
        next: (newProducto) => {
          // Añadir a la lista de productos
          this.productos.set([...this.productos(), newProducto]);
          this.closeForm();
        },
        error: (err) => {
          console.error('Error creating producto', err);
          this.error.set('Error al crear el producto');
        }
      });
    }
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
