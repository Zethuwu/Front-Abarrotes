import { AuthService } from './../../services/auth.service';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';
import { Producto, Proveedor } from '../../models/interfaces';
import { RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';


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
  selectedFile = signal<File | null>(null);

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      precio: [1, [Validators.required, Validators.min(1), this.dosDecimalesValidator]],
      imagenUrl: [''],
      status: ['CREADO_CORRECTAMENTE'],
      proveedorId: [null, [Validators.required]],
      inventarioDTO: this.fb.group({
        cantidadInicial: [1, [Validators.required, Validators.min(1), this.dosDecimalesValidator]],
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
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los productos');
        console.error('Error loading productos', err);
        this.loading.set(false);
      }
    });

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
        imagenUrl: producto.imagenUrl,
        proveedorId: producto.proveedorId,
        inventarioDTO: {
          cantidadActual: producto.inventarioDTO?.cantidadActual ?? 1,
          cantidadInicial: producto.inventarioDTO?.cantidadInicial ?? 1,
        }
      });
      this.selectedFile.set(null);
    } else {
      this.editingProducto.set(null);
      this.productoForm.reset({
        nombre: '',
        descripcion: '',
        precio: 1,
        imagenUrl: '',
        proveedorId: null,
        inventarioDTO: {
          cantidadActual: 1,
          cantidadInicial: 1,
        }
      });
      this.selectedFile.set(null);
    }

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.productoForm.reset();
    this.editingProducto.set(null);
    this.selectedFile.set(null);
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      this.selectedFile.set(inputElement.files[0]);
    }
  }

  getImageName(imagePath: string | undefined): string {
    if (!imagePath) return 'No hay imagen';
    const parts = imagePath.split('/');
    return parts[parts.length - 1];
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('Error al cargar la imagen:', imgElement.src);
    imgElement.src = 'assets/placeholder.jpg';
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
      return;
    }

    const productoData = this.productoForm.value;

    if (this.editingProducto()) {
      this.apiService.updateProducto(this.editingProducto()!.id, productoData).subscribe({
        next: (updatedProducto) => {
          console.log('Producto actualizado:', updatedProducto);

          if (this.selectedFile()) {
            this.uploadImage(updatedProducto.id, this.selectedFile()!);
          } else {
            const updatedProductos = this.productos().map(p =>
              p.id === updatedProducto.id ? updatedProducto : p
            );
            this.productos.set(updatedProductos);
            this.closeForm();
          }
        },
        error: (err) => {
          console.error('Error updating producto', err);
          this.error.set('Error al actualizar el producto');
        }
      });
    } else {
      this.apiService.createProducto(productoData).subscribe({
        next: (newProducto) => {
          console.log('Nuevo producto creado:', newProducto);
          if (this.selectedFile()) {
            this.uploadImage(newProducto.id, this.selectedFile()!);
          } else {
            this.productos.set([...this.productos(), newProducto]);
            this.closeForm();
          }
        },
        error: (err) => {
          console.error('Error creating producto', err);
          this.error.set('Error al crear el producto');
        }
      });
    }
  }

  uploadImage(productoId: number, file: File): void {
    console.log('Subiendo imagen para el producto ID:', productoId);

    this.apiService.uploadProductoImage(productoId, file).subscribe({
      next: () => {
        console.log('Imagen subida correctamente');
        this.apiService.getProductos().subscribe({
          next: (productos) => {
            console.log('Productos actualizados después de subir imagen:', productos);
            this.productos.set(productos);
            this.closeForm();
          }
        });
      },
      error: (err) => {
        console.error('Error uploading image', err);
        this.error.set('Error al subir la imagen');
        this.apiService.getProductos().subscribe({
          next: (productos) => {
            this.productos.set(productos);
            this.closeForm();
          }
        });
      }
    });
  }

  deleteProducto(id: number): void {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      this.apiService.deleteProducto(id).subscribe({
        next: () => {
          this.productos.set(this.productos().filter(p => p.id !== id));
        },
        error: (err) => {
          console.error('Error deleting producto', err);
          this.error.set('Error al eliminar el producto');
        }
      });
    }
  }

  dosDecimalesValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    return /^\d+(\.\d{1,2})?$/.test(value) ? null : { dosDecimales: true };
  }
}
