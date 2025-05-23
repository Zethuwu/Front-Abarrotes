import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Cliente } from '../../models/interfaces';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ClientesComponent implements OnInit {
  clientes = signal<Cliente[]>([]);
  loading = signal(true);
  error = signal('');

  clienteForm: FormGroup;
  editingCliente = signal<Cliente | null>(null);
  showForm = signal(false);

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    public authService : AuthService
  ) {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, soloTextoValidator]],
      apellido: ['', [Validators.required, soloTextoValidator]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);

    this.apiService.getClientes().subscribe({
      next: (clientes) => {
        this.clientes.set(clientes);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los clientes');
        console.error('Error loading clientes', err);
        this.loading.set(false);
      }
    });
  }

  openForm(cliente?: Cliente): void {
    if (cliente) {
      this.editingCliente.set(cliente);
      this.clienteForm.patchValue({
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        email: cliente.email
      });
    } else {
      this.editingCliente.set(null);
      this.clienteForm.reset();
    }

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.clienteForm.reset();
    this.editingCliente.set(null);
  }

  onSubmit(): void {
    if (this.clienteForm.invalid) {
      return;
    }

    const clienteData = this.clienteForm.value;

    if (this.editingCliente()) {
      // Actualizar cliente existente
      this.apiService.updateCliente(this.editingCliente()!.id, clienteData).subscribe({
        next: (updatedCliente) => {
          // Actualizar la lista de clientes
          const updatedClientes = this.clientes().map(c =>
            c.id === updatedCliente.id ? updatedCliente : c
          );
          this.clientes.set(updatedClientes);
          this.closeForm();
        },
        error: (err) => {
          console.error('Error updating cliente', err);
          this.error.set('Error al actualizar el cliente');
        }
      });
    } else {
      // Crear nuevo cliente
      this.apiService.createCliente(clienteData).subscribe({
        next: (newCliente) => {
          // Añadir a la lista de clientes
          this.clientes.set([...this.clientes(), newCliente]);
          this.closeForm();
        },
        error: (err) => {
          console.error('Error creating cliente', err);
          this.error.set('Error al crear el cliente');
        }
      });
    }
  }

  deleteCliente(id: number): void {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      this.apiService.deleteCliente(id).subscribe({
        next: () => {
          // Eliminar de la lista de clientes
          this.clientes.set(this.clientes().filter(c => c.id !== id));
        },
        error: (err) => {
          console.error('Error deleting cliente', err);
          this.error.set('Error al eliminar el cliente');
        }
      });
    }
  }
}


function soloTextoValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
    return { soloTexto: true };
  }
  return null;
}
