import { Component, type OnInit, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import { ApiService } from "../../services/api.service"
import { Inventario, Producto } from "../../models/interfaces"

@Component({
  selector: "app-inventario",
  templateUrl: "./inventario.component.html",
  styleUrls: ["./inventario.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class InventarioComponent implements OnInit {
  inventario = signal<Inventario[]>([])
  productos = signal<Producto[]>([])
  loading = signal(true)
  error = signal("")

  inventarioForm: FormGroup
  editingInventario = signal<Inventario | null>(null)
  showForm = signal(false)

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
  ) {
    this.inventarioForm = this.fb.group({
      producto_id: [null, [Validators.required]],
      cantidad_actual: [0, [Validators.required, Validators.min(0)]],
      cantidad_inicial: [0, [Validators.required, Validators.min(0)]],
      minimo_requerido: [0, [Validators.required, Validators.min(0)]],
    })
  }

  ngOnInit(): void {
    this.loadData()
  }

  loadData(): void {
    this.loading.set(true)

    // Cargar inventario
    this.apiService.getInventario().subscribe({
      next: (inventario) => {
        this.inventario.set(inventario)
        this.loading.set(false)
      },
      error: (err) => {
        this.error.set("Error al cargar el inventario")
        console.error("Error loading inventario", err)
        this.loading.set(false)
      },
    })

    // Cargar productos para el formulario
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos)
      },
      error: (err) => {
        console.error("Error loading productos", err)
      },
    })
  }

  openForm(item?: Inventario): void {
    if (item) {
      this.editingInventario.set(item)
      this.inventarioForm.patchValue({
        producto_id: item.producto_id,
        cantidad_actual: item.cantidad_actual,
        cantidad_inicial: item.cantidad_inicial,
        minimo_requerido: item.minimo_requerido,
      })
    } else {
      this.editingInventario.set(null)
      this.inventarioForm.reset({
        cantidad_actual: 0,
        cantidad_inicial: 0,
        minimo_requerido: 0,
        producto_id: null,
      })
    }

    this.showForm.set(true)
  }

  closeForm(): void {
    this.showForm.set(false)
    this.inventarioForm.reset()
    this.editingInventario.set(null)
  }

  onSubmit(): void {
    if (this.inventarioForm.invalid) {
      return
    }

    const inventarioData = this.inventarioForm.value

    if (this.editingInventario()) {
      // Actualizar inventario existente
      this.apiService.updateInventario(this.editingInventario()!.id, inventarioData).subscribe({
        next: (updatedInventario) => {
          // Actualizar la lista de inventario
          const updatedItems = this.inventario().map((item) =>
            item.id === updatedInventario.id ? updatedInventario : item,
          )
          this.inventario.set(updatedItems)
          this.closeForm()
        },
        error: (err) => {
          console.error("Error updating inventario", err)
          this.error.set("Error al actualizar el inventario")
        },
      })
    } else {
      // Crear nuevo inventario
      this.apiService.createInventario(inventarioData).subscribe({
        next: (newInventario) => {
          // Añadir a la lista de inventario
          this.inventario.set([...this.inventario(), newInventario])
          this.closeForm()
        },
        error: (err) => {
          console.error("Error creating inventario", err)
          this.error.set("Error al crear el inventario")
        },
      })
    }
  }

  getProductoNombre(productoId: number): string {
    const producto = this.productos().find((p) => p.id === productoId)
    return producto ? producto.nombre : `Producto #${productoId}`
  }

  getInventarioStatus(item: Inventario): string {
    if (item.cantidad_actual <= 0) {
      return "agotado"
    } else if (item.cantidad_actual <= item.minimo_requerido) {
      return "bajo"
    } else {
      return "normal"
    }
  }
}
