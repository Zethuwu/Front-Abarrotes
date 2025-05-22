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
  selectedFile = signal<File | null>(null);

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
        imagenUrl: producto.imagenUrl,
        proveedorId: producto.proveedorId,
        inventarioDTO: {
          cantidadActual: producto.inventarioDTO?.cantidadActual ?? 0,
          cantidadInicial: producto.inventarioDTO?.cantidadInicial ?? 0,
          minimoRequerido: producto.inventarioDTO?.minimoRequerido ?? 0
        }
      });
      // Limpiamos el archivo seleccionado al abrir el formulario
      this.selectedFile.set(null);
    } else {
      this.editingProducto.set(null);
      this.productoForm.reset({
        nombre: '',
        descripcion: '',
        precio: 0,
        imagenUrl: '',
        proveedorId: null,
        inventarioDTO: {
          cantidadActual: 0,
          cantidadInicial: 0,
          minimoRequerido: 0
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
    // Obtener el nombre del archivo de la ruta completa
    const parts = imagePath.split('/');
    return parts[parts.length - 1];
  }

  // Nuevo método para manejar errores de carga de imágenes
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.error('Error al cargar la imagen:', imgElement.src);
    // Establecer una imagen de respaldo
    imgElement.src = 'assets/placeholder.jpg';
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
          console.log('Producto actualizado:', updatedProducto); // Depuración

          // Si hay un archivo seleccionado, subimos la imagen
          if (this.selectedFile()) {
            this.uploadImage(updatedProducto.id, this.selectedFile()!);
          } else {
            // Si no hay archivo seleccionado, actualizamos la lista de productos
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
      // Crear nuevo producto
      this.apiService.createProducto(productoData).subscribe({
        next: (newProducto) => {
          console.log('Nuevo producto creado:', newProducto); // Depuración

          // Si hay un archivo seleccionado, subimos la imagen
          if (this.selectedFile()) {
            this.uploadImage(newProducto.id, this.selectedFile()!);
          } else {
            // Si no hay archivo seleccionado, añadimos el producto a la lista
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
    console.log('Subiendo imagen para el producto ID:', productoId); // Depuración

    this.apiService.uploadProductoImage(productoId, file).subscribe({
      next: () => {
        console.log('Imagen subida correctamente'); // Depuración

        // Recargar los productos para obtener la URL de imagen actualizada
        this.apiService.getProductos().subscribe({
          next: (productos) => {
            console.log('Productos actualizados después de subir imagen:', productos); // Depuración
            this.productos.set(productos);
            this.closeForm();
          }
        });
      },
      error: (err) => {
        console.error('Error uploading image', err);
        this.error.set('Error al subir la imagen');

        // Aún así cerramos el formulario y actualizamos la lista, pero sin la imagen
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
