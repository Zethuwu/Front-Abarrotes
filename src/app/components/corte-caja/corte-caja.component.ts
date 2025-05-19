import { ApiService } from './../../services/api.service';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CorteCajaDTO} from '../../models/interfaces';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-corte-caja',
  templateUrl: './corte-caja.component.html',
  styleUrls: ['./corte-caja.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CorteCajaComponent implements OnInit {
  corteCaja = signal<CorteCajaDTO[]>([]);
  loading = signal(false);
  error = signal('');
  fechaSeleccionada = signal<string>('');

  form: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      fecha: ['']
    });
  }

  ngOnInit(): void {
    // Nada en ngOnInit aún
  }

  buscarCorteCaja(): void {
    const fecha = this.form.value.fecha;
    if (!fecha) {
      this.error.set('Selecciona una fecha válida.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.corteCaja.set([]);

    this.apiService.getCorteDeCajaPorFecha(fecha).subscribe({
      next: (data) => {
        this.corteCaja.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener el corte de caja', err);
        this.error.set('No se pudo cargar el corte de caja');
        this.loading.set(false);
      }
    });
  }
}
