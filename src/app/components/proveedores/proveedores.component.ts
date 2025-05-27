import { Component, type OnInit, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder,  FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import  { ApiService } from "../../services/api.service"
import  { Proveedor } from "../../models/interfaces"

@Component({
  selector: "app-proveedores",
  templateUrl: "./proveedores.component.html",
  styleUrls: ["./proveedores.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProveedoresComponent implements OnInit {
  proveedores = signal<Proveedor[]>([])
  loading = signal(true)
  error = signal("")

  proveedorForm: FormGroup
  editingProveedor = signal<Proveedor | null>(null)
  showForm = signal(false)

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
  ) {
    this.proveedorForm = this.fb.group({
      nombre: ["", [Validators.required]],
      correo: ["", [Validators.required, Validators.email]],
    })
  }

  ngOnInit(): void {
    this.loadProveedores()
  }

  loadProveedores(): void {
    this.loading.set(true)

    this.apiService.getProveedores().subscribe({
      next: (proveedores) => {
        this.proveedores.set(proveedores)
        this.loading.set(false)
      },
      error: (err) => {
        this.error.set("Error al cargar los proveedores")
        console.error("Error loading proveedores", err)
        this.loading.set(false)
      },
    })
  }

  openForm(proveedor?: Proveedor): void {
    if (proveedor) {
      this.editingProveedor.set(proveedor)
      this.proveedorForm.patchValue({
        nombre: proveedor.nombre,
        correo: proveedor.correo,
      })
    } else {
      this.editingProveedor.set(null)
      this.proveedorForm.reset()
    }

    this.showForm.set(true)
  }

  closeForm(): void {
    this.showForm.set(false)
    this.proveedorForm.reset()
    this.editingProveedor.set(null)
  }

  onSubmit(): void {
    if (this.proveedorForm.invalid) {
      return
    }

    const proveedorData = this.proveedorForm.value

    if (this.editingProveedor()) {
      this.apiService.updateProveedor(this.editingProveedor()!.id, proveedorData).subscribe({
        next: (updatedProveedor) => {
          const updatedProveedores = this.proveedores().map((p) =>
            p.id === updatedProveedor.id ? updatedProveedor : p,
          )
          this.proveedores.set(updatedProveedores)
          this.closeForm()
        },
        error: (err) => {
          console.error("Error updating proveedor", err)
          this.error.set("Error al actualizar el proveedor")
        },
      })
    } else {
      this.apiService.createProveedor(proveedorData).subscribe({
        next: (newProveedor) => {
          this.proveedores.set([...this.proveedores(), newProveedor])
          this.closeForm()
        },
        error: (err) => {
          console.error("Error creating proveedor", err)
          this.error.set("Error al crear el proveedor")
        },
      })
    }
  }

  deleteProveedor(id: number): void {
    if (confirm("¿Está seguro de eliminar este proveedor?")) {
      this.apiService.deleteProveedor(id).subscribe({
        next: () => {
          this.proveedores.set(this.proveedores().filter((p) => p.id !== id))
        },
        error: (err) => {
          console.error("Error deleting proveedor", err)
          this.error.set("Error al eliminar el proveedor")
        },
      })
    }
  }
}
