import { ChangeDetectorRef, Component, OnInit, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from "@angular/forms"
import { ApiService } from "../../services/api.service"
import { AuthService } from "../../services/auth.service"
import { Factura, Cliente, Usuario, Producto } from '../../models/interfaces';
import { RouterModule } from "@angular/router"
import { FormsModule } from '@angular/forms';

interface ProductoAgregado {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

@Component({
  selector: "app-facturas",
  templateUrl: "./facturas.component.html",
  styleUrls: ["./facturas.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
})
export class FacturasComponent implements OnInit {
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

  busquedaCliente = '';
  busquedaUsuario = '';

  selectedProductoId: number | null = null;
  selectedCantidad: number = 1;
  selectedPrecioUnitario: number = 0;
  productosAgregados: ProductoAgregado[] = [];

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.facturaForm = this.fb.group({
      clienteId: [null, [Validators.required]],
      usuarioId: [null, [Validators.required]],
      detalles: this.fb.array([]),
    })
  }

  ngOnInit(): void {
    this.loadData();
    this.apiService.getUsuarios().subscribe({
      next: (usuarios) => this.usuarios.set(usuarios),
      error: () => this.usuarios.set([]),
    });
  }

  loadData(): void {
    this.loading.set(true)
    this.apiService.getClientes().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes)
      },
      error: (err) => {
        console.error("Error loading clientes", err)
      },
    })

    this.apiService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios)
      },
      error: (err) => {
        console.error("Error loading usuarios", err)
      },
    })

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
      productoId: [null, [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
    })
  }

  agregarProductoALista(): void {
    if (!this.selectedProductoId || !this.selectedCantidad || this.selectedCantidad <= 0 || this.selectedPrecioUnitario <= 0) {
      return;
    }

    const existingIndex = this.productosAgregados.findIndex(p => p.productoId === Number(this.selectedProductoId));

    if (existingIndex >= 0) {
      this.productosAgregados[existingIndex].cantidad += this.selectedCantidad;
    } else {
      const nuevoProducto: ProductoAgregado = {
        productoId: Number(this.selectedProductoId),
        cantidad: this.selectedCantidad,
        precioUnitario: this.selectedPrecioUnitario
      };
      this.productosAgregados.push(nuevoProducto);
    }
    this.limpiarCamposProducto();
  }

  removerProductoDeLista(index: number): void {
    this.productosAgregados.splice(index, 1);
  }

  limpiarCamposProducto(): void {
    this.selectedProductoId = null;
    this.selectedCantidad = 1;
    this.selectedPrecioUnitario = 0;
  }

  calcularTotalLista(): number {
    return this.productosAgregados.reduce((total, producto) => {
      return total + (producto.cantidad * producto.precioUnitario);
    }, 0);
  }

  onProductoSeleccionado(): void {
    if (this.selectedProductoId) {
      const producto = this.productos().find(p => p.id === Number(this.selectedProductoId));
      if (producto) {
        this.selectedPrecioUnitario = producto.precio;
      }
    } else {
      this.selectedPrecioUnitario = 0;
    }
  }

  private convertirListaAFormArray(): void {
    while (this.detallesArray.length) {
      this.detallesArray.removeAt(0);
    }

    this.productosAgregados.forEach(producto => {
      const detalleGroup = this.fb.group({
        productoId: [producto.productoId, [Validators.required]],
        cantidad: [producto.cantidad, [Validators.required, Validators.min(1)]],
        precioUnitario: [producto.precioUnitario, [Validators.required, Validators.min(0)]],
      });
      this.detallesArray.push(detalleGroup);
    });
  }

  addDetalle(): void {
    this.detallesArray.push(this.createDetalleFormGroup())
  }

  removeDetalle(index: number): void {
    this.detallesArray.removeAt(index)
  }

  updatePrecioUnitario(index: number): void {
    const detalleGroup = this.detallesArray.at(index) as FormGroup
    const productoId = detalleGroup.get("productoId")?.value

    if (productoId) {
      const producto = this.productos().find((p) => p.id === Number(productoId))
      if (producto) {
        detalleGroup.get("precioUnitario")?.setValue(producto.precio)
      }
    }
  }

  openForm(factura?: Factura): void {
    this.facturaForm.reset();
    while (this.detallesArray.length) {
      this.detallesArray.removeAt(0);
    }

    this.productosAgregados = [];
    this.limpiarCamposProducto();

    if (factura) {
      this.editingFactura.set(factura);
      this.facturaForm.patchValue({
        clienteId: factura.clienteId,
        usuarioId: factura.usuarioId,
      });

      if (factura.detalles) {
        this.productosAgregados = factura.detalles.map(detalle => ({
          productoId: detalle.productoId,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario
        }));
      }

      this.showForm.set(true);
    } else {
      this.editingFactura.set(null);

      const usuarioActual = this.authService.currentUserSignal();
      if (usuarioActual?.username) {
        this.apiService.getUsuarioByUsername(usuarioActual.username).subscribe({
          next: (usuarioCompleto) => {
            this.facturaForm.patchValue({
              usuarioId: usuarioCompleto.id
            });
            const usuariosActuales = this.usuarios();
            if (!usuariosActuales.some(u => u.id === usuarioCompleto.id)) {
              this.usuarios.set([...usuariosActuales, usuarioCompleto]);
            }
            this.showForm.set(true);
          },
          error: () => {
            this.showForm.set(true);
          }
        });
      } else {
        this.showForm.set(true);
      }
    }
  }

  closeForm(): void {
    this.showForm.set(false)
    this.facturaForm.reset()
    this.editingFactura.set(null)
    this.productosAgregados = [];
    this.limpiarCamposProducto();
  }

  onSubmit(): void {
    if (this.facturaForm.invalid || this.productosAgregados.length === 0) {
      return
    }

    this.convertirListaAFormArray();

    const facturaData = {
      ...this.facturaForm.value,
      fecha: new Date(),
      total: this.calcularTotalLista(),
    }

    if (this.editingFactura()) {
      this.apiService.updateFactura(this.editingFactura()!.id, facturaData).subscribe({
        next: (updatedFactura) => {
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
      this.apiService.createFactura(facturaData).subscribe({
        next: (newFactura) => {
          this.facturas.set([...this.facturas(), newFactura]);
          this.selectedFactura.set(newFactura);
          this.showDetalles.set(newFactura.id);
          this.closeForm();
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
      const precioUnitario = detalle.get("precioUnitario")?.value || 0

      total += cantidad * precioUnitario
    }

    return total
  }

  getClienteNombre(clienteId: number): string {
    const cliente = this.clientes().find((c) => c.id === clienteId)
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente #${clienteId}`
  }

  getUsuarioNombre(usuarioId: number): string {
    const usuario = this.usuarios().find(u => u.id === usuarioId);
    return usuario ? usuario.nombre : `Usuario #${usuarioId}`;
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

    if (!factura.detalles) {
      this.apiService.getFactura(factura.id).subscribe({
        next: (facturaCompleta) => {
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

  onClienteSeleccionado(nombre: string) {
    this.apiService.getCliente(nombre).subscribe({
      next: (cliente) => {
        this.facturaForm.patchValue({ cliente_id: cliente.id });
      },
      error: () => {
        this.facturaForm.patchValue({ cliente_id: null });
      }
    });
  }

  buscarFacturasPorCliente(): void {
    if (!this.busquedaCliente.trim()) return;
    this.loading.set(true);
    this.apiService.getFacturasByCliente(this.busquedaCliente.trim()).subscribe({
      next: (facturas) => {
        this.facturas.set(facturas);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set("No se encontraron facturas para ese cliente");
        this.loading.set(false);
      }
    });
  }

  buscarFacturasPorUsuario(): void {
    if (!this.busquedaUsuario.trim()) return;
    this.loading.set(true);
    this.apiService.getFacturasByUsuario(this.busquedaUsuario.trim()).subscribe({
      next: (facturas) => {
        this.facturas.set(facturas);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set("No se encontraron facturas para ese usuario");
        this.loading.set(false);
      }
    });
  }

  resetFiltros(): void {
    this.busquedaCliente = '';
    this.busquedaUsuario = '';
    this.loadData();
  }

  imprimirFactura(): void {
    const factura = this.selectedFactura();
    if (!factura) return;

    this.apiService.enviarFactura(factura.id).subscribe({
      next: (mensaje) => {
        alert(mensaje);
      },
      error: (err) => {
        alert('Error al enviar la factura');
        console.error(err);
      }
    });
  }

  cancelarFacturaVisual(factura: Factura): void {
    const actualizadas = this.facturas().map(f =>
      f.id === factura.id
        ? { ...f, activa: true }
        : f
    );
    this.facturas.set(actualizadas);
    console.log('Se presionó cancelar factura visual');
    this.cdr.detectChanges();
  }
}
