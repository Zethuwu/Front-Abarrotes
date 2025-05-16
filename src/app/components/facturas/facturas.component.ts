import { Component, OnInit, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder,  FormGroup,  FormArray, Validators, ReactiveFormsModule } from "@angular/forms"
import { ApiService } from "../../services/api.service"
import { Factura, Cliente, Usuario, Producto } from "../../models/interfaces"
import { RouterModule } from "@angular/router"

@Component({
  selector: "app-facturas",
  templateUrl: "./facturas.component.html",
  styleUrls: ["./facturas.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class FacturasComponent implements OnInit {
[x: string]: any
  facturas = signal<Factura[]>([])
  clientes = signal<Cliente[]>([])
  usuarios = signal<Usuario[]>([])
  productos = signal<Producto[]>([])
  loading = signal(true)
  error = signal("")

  facturaForm: FormGroup
  editingFactura = signal<Factura | null>(null)
  showForm = signal(false)
  showDetalles = signal<number | null>(null)
  selectedFactura = signal<Factura | null>(null)

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
  ) {
    this.facturaForm = this.fb.group({
      cliente_id: [null, [Validators.required]],
      usuario_id: [null, [Validators.required]],
      detalles: this.fb.array([]),
    })
  }

  ngOnInit(): void {
    this.loadData()
  }

  loadData(): void {
    this.loading.set(true)

    // Cargar facturas
    this.apiService.getFacturas().subscribe({
      next: (facturas) => {
        this.facturas.set(facturas)
        this.loading.set(false)
      },
      error: (err) => {
        this.error.set("Error al cargar las facturas")
        console.error("Error loading facturas", err)
        this.loading.set(false)
      },
    })

    // Cargar clientes
    this.apiService.getClientes().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes)
      },
      error: (err) => {
        console.error("Error loading clientes", err)
      },
    })

    // Cargar usuarios
    this.apiService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios)
      },
      error: (err) => {
        console.error("Error loading usuarios", err)
      },
    })

    // Cargar productos
    this.apiService.getProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos)
      },
      error: (err) => {
        console.error("Error loading productos", err)
      },
    })
  }

  get detallesArray(): FormArray {
    return this.facturaForm.get("detalles") as FormArray
  }

  createDetalleFormGroup(): FormGroup {
    return this.fb.group({
      producto_id: [null, [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: [0, [Validators.required, Validators.min(0)]],
    })
  }

  addDetalle(): void {
    this.detallesArray.push(this.createDetalleFormGroup())
  }

  removeDetalle(index: number): void {
    this.detallesArray.removeAt(index)
  }

  updatePrecioUnitario(index: number): void {
    const detalleGroup = this.detallesArray.at(index) as FormGroup
    const productoId = detalleGroup.get("producto_id")?.value

    if (productoId) {
      const producto = this.productos().find((p) => p.id === Number(productoId))
      if (producto) {
        detalleGroup.get("precio_unitario")?.setValue(producto.precio)
      }
    }
  }

  openForm(factura?: Factura): void {
    // Limpiar el formulario
    this.facturaForm.reset()
    while (this.detallesArray.length) {
      this.detallesArray.removeAt(0)
    }

    if (factura) {
      this.editingFactura.set(factura)

      // Cargar los datos de la factura
      this.facturaForm.patchValue({
        cliente_id: factura.cliente_id,
        usuario_id: factura.usuario_id,
      })

      // Cargar los detalles si existen
      if (factura.detalles && factura.detalles.length > 0) {
        factura.detalles.forEach((detalle) => {
          const detalleGroup = this.createDetalleFormGroup()
          detalleGroup.patchValue({
            producto_id: detalle.producto_id,
            cantidad: detalle.cantidad,
            precio_unitario: detalle.precio_unitario,
          })
          this.detallesArray.push(detalleGroup)
        })
      } else {
        // Si no hay detalles, añadir uno vacío
        this.addDetalle()
      }
    } else {
      this.editingFactura.set(null)
      // Añadir un detalle vacío para nueva factura
      this.addDetalle()
    }

    this.showForm.set(true)
  }

  closeForm(): void {
    this.showForm.set(false)
    this.facturaForm.reset()
    this.editingFactura.set(null)
  }

  onSubmit(): void {
    if (this.facturaForm.invalid) {
      return
    }

    const facturaData = {
      ...this.facturaForm.value,
      fecha: new Date(),
      activa: true,
      total: this.calcularTotal(),
    }

    if (this.editingFactura()) {
      // Actualizar factura existente
      this.apiService.updateFactura(this.editingFactura()!.id, facturaData).subscribe({
        next: (updatedFactura) => {
          // Actualizar la lista de facturas
          const updatedFacturas = this.facturas().map((f) => (f.id === updatedFactura.id ? updatedFactura : f))
          this.facturas.set(updatedFacturas)
          this.closeForm()
        },
        error: (err) => {
          console.error("Error updating factura", err)
          this.error.set("Error al actualizar la factura")
        },
      })
    } else {
      // Crear nueva factura
      this.apiService.createFactura(facturaData).subscribe({
        next: (newFactura) => {
          // Añadir a la lista de facturas
          this.facturas.set([...this.facturas(), newFactura])
          this.closeForm()
        },
        error: (err) => {
          console.error("Error creating factura", err)
          this.error.set("Error al crear la factura")
        },
      })
    }
  }

  calcularTotal(): number {
    let total = 0

    for (let i = 0; i < this.detallesArray.length; i++) {
      const detalle = this.detallesArray.at(i) as FormGroup
      const cantidad = detalle.get("cantidad")?.value || 0
      const precioUnitario = detalle.get("precio_unitario")?.value || 0

      total += cantidad * precioUnitario
    }

    return total
  }

  getClienteNombre(clienteId: number): string {
    const cliente = this.clientes().find((c) => c.id === clienteId)
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente #${clienteId}`
  }

  getUsuarioNombre(usuarioId: number): string {
    const usuario = this.usuarios().find((u) => u.id === usuarioId)
    return usuario ? usuario.nombre : `Usuario #${usuarioId}`
  }

  getProductoNombre(productoId: number): string {
    const producto = this.productos().find((p) => p.id === productoId)
    return producto ? producto.nombre : `Producto #${productoId}`
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  viewDetalles(factura: Factura): void {
    this.selectedFactura.set(factura)

    // Si la factura no tiene detalles, cargarlos
    if (!factura.detalles) {
      this.apiService.getFactura(factura.id).subscribe({
        next: (facturaCompleta) => {
          // Actualizar la factura en la lista
          const updatedFacturas = this.facturas().map((f) => (f.id === facturaCompleta.id ? facturaCompleta : f))
          this.facturas.set(updatedFacturas)
          this.selectedFactura.set(facturaCompleta)
        },
        error: (err) => {
          console.error("Error loading factura details", err)
          this.error.set("Error al cargar los detalles de la factura")
        },
      })
    }

    this.showDetalles.set(factura.id)
  }

  closeDetalles(): void {
    this.showDetalles.set(null)
    this.selectedFactura.set(null)
  }

  deleteFactura(id: number): void {
    if (confirm("¿Está seguro de eliminar esta factura?")) {
      this.apiService.deleteFactura(id).subscribe({
        next: () => {
          // Eliminar de la lista de facturas
          this.facturas.set(this.facturas().filter((f) => f.id !== id))
        },
        error: (err) => {
          console.error("Error deleting factura", err)
          this.error.set("Error al eliminar la factura")
        },
      })
    }
  }

  get fechaFacturaSeleccionada(): string {
    const factura = this.selectedFactura();
    const fecha = factura?.fecha ?? new Date();
    return this.formatDate(fecha);
  }

  get totalFacturaSeleccionada(): string {
    const total = this.selectedFactura()?.total ?? 0;
    return total.toFixed(2);
  }

}
