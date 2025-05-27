import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { ApiService } from '../../services/api.service';
import { Producto, InventarioDTO, Usuario } from '../../models/interfaces';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ]
})
export class DashboardComponent implements OnInit {

  editingUsuario: Usuario | null = null;
  productos = signal<Producto[]>([]);
  inventarioBajo = signal<InventarioDTO[]>([]);
  usuarios = signal<Usuario[]>([]);
  rolesDisponibles = signal<{ id: number, nombre: string }[]>([]);
  loading = signal(true);
  error = signal('');
  showCrearUsuario = signal(false);
  usuarioForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    roles: new FormControl<number[]>([], { nonNullable: true, validators: [Validators.required] })
  });

  constructor(private apiService: ApiService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadRoles();
  }


  loadUsuarios(): void {
    this.loading.set(true);
    this.apiService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los usuarios');
        this.loading.set(false);
      }
    });
  }

  loadRoles(): void {
    this.apiService.getRoles().subscribe({
      next: (roles) => this.rolesDisponibles.set(roles),
      error: () => this.rolesDisponibles.set([])
    });
  }

  openCrearUsuario(): void {
    this.usuarioForm.reset();
    this.showCrearUsuario.set(true);
  }

  closeCrearUsuario(): void {
    this.showCrearUsuario.set(false);
  }

  crearUsuario(): void {
  const usuarioFormValue = this.usuarioForm.value;
  const rolesArray = usuarioFormValue.roles ?? [];
  const usuarioParaGuardar = {
    nombre: usuarioFormValue.nombre ?? '',
    username: usuarioFormValue.username ?? '',
    password: usuarioFormValue.password ?? '',
    roles: rolesArray.map((id: number) => ({ id }))
  };

  if (this.editingUsuario && this.editingUsuario.id !== undefined) {
    this.apiService.updateUsuario(this.editingUsuario.id, usuarioParaGuardar).subscribe({
      next: () => {
        this.loadUsuarios();
        this.closeCrearUsuario();
        this.editingUsuario = null;
      },
      error: () => alert('Error al actualizar usuario')
    });
  } else {
    this.apiService.createUsuario(usuarioParaGuardar).subscribe({
      next: () => {
        this.loadUsuarios();
        this.closeCrearUsuario();
      },
      error: () => alert('Error al crear usuario')
    });
  }
}

  getRolesLegibles(roles: any[]): string {
    return roles
      ?.map(r => typeof r === 'string'
        ? r.replace('ROLE_', '')
        : (r.nombre ? r.nombre.replace('ROLE_', '') : '')
      )
      .join(', ') || '';
  }
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getRoleLegible(rol: string): string {
    return rol.replace('ROLE_', '');
  }

  openEditarUsuario(usuario: Usuario): void {
  this.usuarioForm.reset();
  this.usuarioForm.patchValue({
    nombre: usuario.nombre,
    username: usuario.username,
    password: '',
    roles: usuario.roles.map((rol: any) => typeof rol === 'string' ? null : rol.id).filter(id => id !== null)
  });
  this.editingUsuario = usuario;
  this.showCrearUsuario.set(true);
}
}
