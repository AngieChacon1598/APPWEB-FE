import { Component, HostListener, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MesaService } from '../../core/services/mesa.service';
import { ReservasService } from '../../core/services/reservas.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';
import { MesaRestaurante } from '../../core/models/mesa.models';
import { HistoryReservationResponse } from '../../core/models/reservas.models';

@Component({
  selector: 'app-reservacion',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservacion.html',
  styleUrl: './reservacion.scss'
})
export class Reservacion implements OnInit {
  mesas: MesaRestaurante[] = [];
  // Modo multi-selección para reservar varias mesas
  multiSelectMode = false;
  selectedMesaIds: number[] = [];

  readonly fechaHoy: Date = new Date();

  fechaHoyComoString(): string {
    const d = this.fechaHoy;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0'); // meses 0-11
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // yyyy-MM-dd
  }

  minDate: string | null = this.fechaHoyComoString(); // null = sin restricción
  // Mapa de sets de horas reservadas por mesa cuando se abre el modal multi
  reservedSetsByMesa: { [mesaId: number]: Set<string> } = {};
  loading = false;
  error: string | null = null;
  // Fecha seleccionada en input (ISO yyyy-MM-dd). Si null, usaremos hoy.
  private _selectedDateIso: string | null = null;
  public get selectedDateIso(): string | null {
    return this._selectedDateIso;
  }
  public set selectedDateIso(value: string | null) {
    // Evitar acciones si no cambia
    if (this._selectedDateIso === value) return;
    this._selectedDateIso = value;
    // Cuando el usuario cambia la fecha, actualizamos la vista completa
    // 1) recargar listado de mesas (por si hay reglas dependientes de fecha)
    this.loadMesasDisponibles();
    // 2) si hay una mesa seleccionada, recargar sus horarios
    if (this.selectedMesaId) {
      this.fetchAvailableTimes(this.selectedMesaId);
    } else {
      // limpiar horarios previos
      this.availableTimes = [];
    }
    // Si el modal de creación está abierto y hay una mesa en el modal, refrescar los slots mostrados
    if (this.showCreateModal && this.modalMesa) {
      this.refreshCreateSlots();
    }
  }

  // Mesa seleccionada para ver horarios
  selectedMesaId: number | null = null;
  availableTimes: HistoryReservationResponse[] = [];
  loadingTimes = false;
  // Modal para ver reservas de la mesa
  showModal = false;
  modalMesa: MesaRestaurante | null = null;
  reservedTimes: HistoryReservationResponse[] = [];
  reservedLoading = false;
  // Crear reservación
  showCreateModal = false;
  createLoading = false;
  createSuccess: string | null = null;
  createError: string | null = null;
  // Si true, intentamos crear una reservación idéntica para todas las mesas disponibles
  applyToAll = false;
  // Estructura del formulario de creación
  createForm: {
    idUsuario?: number | null;
    nameReservation: string;
    dateReservation: string; // dd/MM/yyyy
    detallesRequest: Array<{
      amountPeople: number;
      requirements?: string;
      hourReservation: string;
      dateReservation: string;
      tableId?: number;
    }>;
  } = {
      idUsuario: null,
      nameReservation: '',
      dateReservation: '',
      detallesRequest: [{ amountPeople: 1, requirements: '', hourReservation: '', dateReservation: '', tableId: undefined }]
    };
  // Lista de horarios para selección (08:00 - 22:00 por defecto)
  createTimeSlots: string[] = [];
  // Conjunto de horas ya reservadas (formato HH:MM) para deshabilitar opciones
  reservedSlotSet: Set<string> = new Set();

  constructor(private readonly mesaService: MesaService, private readonly reservasService: ReservasService, private readonly authService: AuthService) {
    // inicializar fecha ISO con hoy para que el input muestre hoy por defecto
    const todayIso = new Date().toISOString().slice(0, 10); // yyyy-MM-dd
    // setear la propiedad interna para evitar disparar recargas en construcción
    this._selectedDateIso = todayIso;
  }

  ngOnInit(): void {
    this.loadMesasDisponibles();
  }

  loadMesasDisponibles(): void {
    this.loading = true;
    this.error = null;
    this.mesaService.getMesasByState('A').subscribe({
      next: (resp) => {
        if (resp?.content && Array.isArray(resp.content)) {
          this.mesas = resp.content;
        } else {
          this.mesas = [];
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando mesas disponibles', err);
        this.error = 'No se pudieron cargar las mesas disponibles';
        this.loading = false;
      }
    });
  }

  reservarMesa(mesa: MesaRestaurante) {
    // Alternar selección: si ya está seleccionada, deseleccionar
    if (this.selectedMesaId === mesa.idTable) {
      this.selectedMesaId = null;
      this.availableTimes = [];
      return;
    }

    this.selectedMesaId = mesa.idTable;
    this.fetchAvailableTimes(mesa.idTable);
  }

  toggleMultiSelectMode() {
    this.multiSelectMode = !this.multiSelectMode;
    if (!this.multiSelectMode) {
      this.selectedMesaIds = [];
    }
  }

  toggleMesaSelection(mesa: MesaRestaurante, event?: Event) {
    if (!this.multiSelectMode) return;
    if (event) event.stopPropagation();
    const idx = this.selectedMesaIds.indexOf(mesa.idTable);
    if (idx >= 0) {
      this.selectedMesaIds.splice(idx, 1);
    } else {
      this.selectedMesaIds.push(mesa.idTable);
    }
  }

  public formatIsoToDdMmYyyy(iso: string): string {
    // iso expected: yyyy-MM-dd
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  fetchAvailableTimes(mesaId: number) {
    this.loadingTimes = true;
    this.availableTimes = [];

    const fechaParam = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : undefined;

    this.reservasService.getMesasDisponibles(mesaId, fechaParam).subscribe({
      next: (resp) => {
        this.availableTimes = Array.isArray(resp) ? resp : [];
        this.loadingTimes = false;
        console.log('Horas disponibles:', this.availableTimes);
      },
      error: (err) => {
        console.error('Error obteniendo horas disponibles', err);
        this.loadingTimes = false;
        this.availableTimes = [];
      }
    });
  }

  onSelectTime(slot: HistoryReservationResponse) {
    const label = slot.hourReservation || slot.dateReservation || slot['id'] || 'Horario';
    alert('Seleccionado horario: ' + label);
  }

  /** Abrir modal de creación de reserva para una mesa */
  openCreateModal(mesa: MesaRestaurante) {
    this.modalMesa = mesa;
    this.showCreateModal = true;
    // Prefill form: usar la fecha seleccionada o hoy
    const fechaForForm = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : this.formatIsoToDdMmYyyy(new Date().toISOString().slice(0, 10));
    this.createForm.dateReservation = fechaForForm;
    // Prellenar detalle con mesa
    this.createForm.detallesRequest = [{ amountPeople: mesa.ability || 1, requirements: '', hourReservation: '', dateReservation: fechaForForm, tableId: mesa.idTable }];
    // Tomar idUsuario desde AuthService / localStorage si está disponible
    try {
      const stored = this.authService.getIdUser();
      if (stored) {
        const parsed = Number.parseInt(stored, 10);
        this.createForm.idUsuario = Number.isNaN(parsed) ? null : parsed;
      } else {
        this.createForm.idUsuario = null;
      }
    } catch (err) {
      console.warn('No se pudo leer idUser desde AuthService/localStorage', err);
      this.createForm.idUsuario = null;
    }
    // Generar lista de horarios por defecto (08:00 - 22:00 cada 60min)
    this.createTimeSlots = this.generateTimeSlots(8, 22, 60);
    // Cargar horarios disponibles para esa mesa (para mostrar opciones)
    this.loadingTimes = true;
    const fechaForApi = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : undefined;
    // limpiar set antes de pedir
    this.reservedSlotSet.clear();
    this.reservasService.getMesasDisponibles(mesa.idTable, fechaForApi).subscribe({
      next: (resp) => {
        this.availableTimes = Array.isArray(resp) ? resp : [];
        // construir set de horas reservadas
        for (const r of this.availableTimes) {
          const rawLabel = this.formatSlotLabel(r);
          const norm = this.normalizeToHHMM(rawLabel);
          if (norm) this.reservedSlotSet.add(norm);
        }
        // Quitar de la lista de slots las horas ya reservadas Y las horas pasadas
        if (this.createTimeSlots && this.createTimeSlots.length > 0) {
          this.createTimeSlots = this.createTimeSlots.filter(t =>
            !this.reservedSlotSet.has(t) && !this.isTimePast(t)
          );
        }
        // Si la hora actualmente seleccionada fue reservada, limpiar la selección
        const current = this.createForm.detallesRequest[0]?.hourReservation;
        if (current) {
          const curNorm = this.normalizeToHHMM(current);
          if (curNorm && this.reservedSlotSet.has(curNorm)) {
            this.createForm.detallesRequest[0].hourReservation = '';
          }
        }
        this.loadingTimes = false;
      },
      error: (err) => {
        console.error('Error obteniendo horarios para creación', err);
        this.loadingTimes = false;
        this.availableTimes = [];
        this.reservedSlotSet.clear();
      }
    });
  }

  /** Seleccionar una hora desde la lista de horarios y sincronizar con el input time */
  selectCreateTime(slotOrTime: HistoryReservationResponse | string) {
    const hh = typeof slotOrTime === 'string' ? slotOrTime : this.formatSlotLabel(slotOrTime as any);
    if (!this.createForm.detallesRequest || this.createForm.detallesRequest.length === 0) {
      this.createForm.detallesRequest = [{ amountPeople: 1, requirements: '', hourReservation: hh, dateReservation: this.createForm.dateReservation, tableId: this.modalMesa?.idTable }];
      return;
    }

    // Si hay múltiples detalles (reservas por mesa), asignar la misma hora a todos
    if (this.createForm.detallesRequest.length > 1) {
      for (const d of this.createForm.detallesRequest) {
        d.hourReservation = hh;
      }
    } else {
      this.createForm.detallesRequest[0].hourReservation = hh;
    }
  }

  /** Abrir modal de creación para múltiples mesas ya seleccionadas */
  openMultiCreateModal() {
    if (!this.selectedMesaIds || this.selectedMesaIds.length === 0) return;
    this.modalMesa = null;
    this.showCreateModal = true;
    // preparar fecha
    const fechaForForm = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : this.formatIsoToDdMmYyyy(new Date().toISOString().slice(0, 10));
    this.createForm.dateReservation = fechaForForm;
    // crear detalles por mesa seleccionada
    this.createForm.detallesRequest = this.selectedMesaIds.map(id => {
      const mesa = this.mesas.find(m => m.idTable === id);
      return { amountPeople: mesa?.ability || 1, requirements: '', hourReservation: '', dateReservation: fechaForForm, tableId: id };
    });
    // generar lista de horarios (para los selects)
    this.createTimeSlots = this.generateTimeSlots(8, 22, 60);
    // limpiar estructuras de reserved
    this.reservedSetsByMesa = {};
    // solicitar horarios disponibles para cada mesa seleccionada y construir sets
    this.loadingTimes = true;
    const fechaForApi = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : undefined;
    const calls = this.selectedMesaIds.map(id => this.reservasService.getMesasDisponibles(id, fechaForApi).pipe(
      map(resp => ({ id, resp: Array.isArray(resp) ? resp : [] })),
      catchError(err => of({ id, resp: [] }))
    ));
    forkJoin(calls).subscribe({
      next: results => {
        for (const r of results) {
          const s = new Set<string>();
          for (const it of r.resp) {
            const lbl = this.formatSlotLabel(it);
            const norm = this.normalizeToHHMM(lbl);
            if (norm) s.add(norm);
          }
          this.reservedSetsByMesa[r.id] = s;
        }
        this.loadingTimes = false;
      },
      error: err => {
        console.warn('Error cargando disponibilidades para mesas seleccionadas', err);
        this.loadingTimes = false;
      }
    });
    // prefill idUsuario if available
    const stored = this.authService.getIdUser();
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      this.createForm.idUsuario = Number.isNaN(parsed) ? null : parsed;
    } else {
      this.createForm.idUsuario = null;
    }
  }

  /** Genera un array de strings HH:MM entre startHour y endHour con step en minutos */
  generateTimeSlots(startHour: number, endHour: number, stepMinutes = 30): string[] {
    const slots: string[] = [];
    const start = startHour * 60; // en minutos
    const end = endHour * 60; // en minutos
    for (let m = start; m <= end; m += stepMinutes) {
      const hh = Math.floor(m / 60).toString().padStart(2, '0');
      const mm = (m % 60).toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }

  /** Enviar la petición para crear la reservación */
  crearReservacionSubmit() {
    this.createError = null;
    this.createSuccess = null;

    // Validaciones mínimas
    if (!this.createForm.nameReservation || this.createForm.nameReservation.trim().length === 0) {
      this.createError = 'El nombre del cliente es obligatorio.';
      return;
    }
    const detalle = this.createForm.detallesRequest[0];
    if (!detalle?.hourReservation || detalle.hourReservation.trim().length === 0) {
      this.createError = 'Seleccione u indique una hora para la reservación.';
      return;
    }

    // Construir payload usando el tipo ReservacionRequest
    // Para evitar usar una fecha desactualizada, calculamos la fecha de envío en el momento del submit
    const fechaForForm = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : this.createForm.dateReservation;
    // Nota: el backend espera guiones en la fecha (ej. 07-11-2025). Convertimos '/' -> '-' solo para la creación
    const safeDate = fechaForForm ? fechaForForm.replaceAll('/', '-') : fechaForForm;
    // Construir lista de detalles a enviar (filtrando mesas que ya tengan ese horario reservado si conocemos las sets)
    const detallesToSend: any[] = this.buildDetallesToSend(safeDate);
    if (detallesToSend.length === 0) {
      this.createError = 'No hay mesas disponibles para el horario seleccionado.';
      return;
    }

    const payload = {
      idUsuario: this.createForm.idUsuario || undefined,
      nameReservation: this.createForm.nameReservation,
      dateReservation: safeDate,
      detallesRequest: detallesToSend
    };
    console.log('Reservación - payload enviado:', payload);

    this.createLoading = true;
    // Si no se aplicará a todas las mesas, comportarse como antes
    if (!this.applyToAll) {
      this.reservasService.crearReservacion(payload as any).subscribe({
        next: (resp) => {
          this.createLoading = false;
          this.createSuccess = typeof resp === 'string' ? resp : 'Reservación creada correctamente.';
          try {
            Swal.fire({
              title: 'Reservación creada',
              icon: 'success',
              draggable: true
            });
          } catch (e) {
            console.warn('Swal not available or failed to show', e);
          }
          // Opcional: cerrar modal automáticamente tras 1s
          setTimeout(() => {
            this.closeCreateModal();
          }, 1000);
        },
        error: (err) => {
          console.error('Error creando reservación', err);
          this.createLoading = false;
          this.createError = 'No se pudo crear la reservación. Intente nuevamente.';
        }
      });
      return;
    }

    // Si se indicó aplicar a todas las mesas, consultamos disponibilidad por mesa y enviamos detalles sólo para las mesas libres
    const selectedHour = detalle?.hourReservation;
    if (!selectedHour) {
      this.createLoading = false;
      this.createError = 'Seleccione u indique una hora para la reservación.';
      return;
    }

    // preparar fecha para la API (dd/MM/yyyy)
    const fechaForApi = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : (this.createForm.dateReservation || undefined);

    // delegar el flujo de crear en todas las mesas a un método separado para reducir complejidad
    this.handleApplyToAll(selectedHour, fechaForApi, payload);
  }

  private buildDetallesToSend(safeDate: string): any[] {
    const detallesToSend: any[] = [];
    for (const d of this.createForm.detallesRequest) {
      const tableId = d.tableId;
      const hourNorm = this.normalizeToHHMM(d.hourReservation) || '';
      // Si tenemos información de horarios reservados por mesa, omitir si está ocupado
      if (tableId && this.reservedSetsByMesa[tableId]?.has(hourNorm)) {
        continue;
      }
      const det: any = {
        amountPeople: d.amountPeople,
        hourReservation: d.hourReservation,
        dateReservation: safeDate,
        tableId: d.tableId
      };
      det.requirements = (d.requirements && d.requirements.trim().length > 0) ? d.requirements.trim() : 'sin requeriminetos';
      detallesToSend.push(det);
    }
    return detallesToSend;
  }

  private handleApplyToAll(selectedHour: string, fechaForApi: string | undefined, payload: any) {
    // crear llamadas paralelas para cada mesa
    const calls = this.mesas.map(mesa =>
      this.reservasService.getMesasDisponibles(mesa.idTable, fechaForApi).pipe(
        map(resp => ({ mesa, resp: Array.isArray(resp) ? resp : [] })),
        catchError(err => {
          console.warn('Error comprobando mesa', mesa.idTable, err);
          return of({ mesa, resp: [] });
        })
      )
    );

    forkJoin(calls).subscribe({
      next: results => {
        const detalles: any[] = [];
        for (const r of results) {
          // normalizar listado de horas reservadas para esta mesa
          const reservedSet = new Set<string>();
          for (const it of r.resp) {
            const lbl = this.formatSlotLabel(it);
            const norm = this.normalizeToHHMM(lbl);
            if (norm) reservedSet.add(norm);
          }
          // si la mesa NO tiene reservado ese horario, la incluimos
          if (!reservedSet.has(this.normalizeToHHMM(selectedHour) || '')) {
            detalles.push({
              amountPeople: r.mesa.ability || 1,
              hourReservation: selectedHour,
              dateReservation: payload.dateReservation,
              tableId: r.mesa.idTable,
              requirements: payload.detallesRequest[0]?.requirements
            });
          }
        }

        if (detalles.length === 0) {
          this.createLoading = false;
          this.createError = 'No hay mesas disponibles para el horario seleccionado.';
          return;
        }

        const multiPayload = {
          idUsuario: payload.idUsuario,
          nameReservation: payload.nameReservation,
          dateReservation: payload.dateReservation,
          detallesRequest: detalles
        };

        // enviar reserva múltiple
        this.reservasService.crearReservacion(multiPayload as any).subscribe({
          next: (resp) => {
            this.createLoading = false;
            this.createSuccess = typeof resp === 'string' ? resp : `Reservación creada en ${detalles.length} mesas.`;
            setTimeout(() => this.closeCreateModal(), 1000);
          },
          error: (err) => {
            console.error('Error creando reservaciones múltiples', err);
            this.createLoading = false;
            this.createError = 'No se pudieron crear las reservaciones múltiples. Intente nuevamente.';
          }
        });
      },
      error: err => {
        console.error('Error en comprobaciones paralelas', err);
        this.createLoading = false;
        this.createError = 'Error comprobando disponibilidad. Intente nuevamente.';
      }
    });
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.createLoading = false;
    this.createError = null;
    this.createSuccess = null;
    // limpiar form pero mantener fecha por conveniencia
    const keepDate = this.createForm.dateReservation;
    this.createForm = { idUsuario: null, nameReservation: '', dateReservation: keepDate, detallesRequest: [{ amountPeople: 1, requirements: '', hourReservation: '', dateReservation: keepDate, tableId: undefined }] };
    // si había una mesa seleccionada para ver horarios, no tocarla
    // Cuando cerramos el modal de creación (tras crear o cancelar), salir del modo multi-select y limpiar selecciones
    this.multiSelectMode = false;
    this.selectedMesaIds = [];
    this.reservedSetsByMesa = {};
    // refrescar catálogo para mostrar cambios recientes
    this.selectedMesaId = null;
    this.availableTimes = [];
    this.loadMesasDisponibles();
  }

  /**
   * Mostrar modal con las reservas (horarios marcados como reserved) para la mesa
   */
  verReservasMesa(mesa: MesaRestaurante) {
    this.modalMesa = mesa;
    this.showModal = true;
    this.reservedLoading = true;
    this.reservedTimes = [];

    const fechaParam = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : undefined;

    this.reservasService.getMesasDisponibles(mesa.idTable, fechaParam).subscribe({
      next: (resp) => {
        this.reservedTimes = Array.isArray(resp) ? resp : [];
        console.log('verReservasMesa response:', this.reservedTimes);
        this.reservedLoading = false;
      },
      error: (err) => {
        console.error('Error cargando reservaciones de mesa', err);
        this.reservedLoading = false;
        this.reservedTimes = [];
      }
    });
  }

  /** Formatea un slot/registro de reservación para mostrar una etiqueta legible */
  formatSlotLabel(slot: HistoryReservationResponse): string {
    const raw = slot.hourReservation || slot.dateReservation || '';
    if (!raw) return 'Horario';

    // Normalizar casos como '1970-01-01 17:30:00.0' => '17:30'
    const withoutDotZero = raw.replace(/\.0+$/, '');
    const parts = withoutDotZero.split(' ');
    if (parts.length === 2 && parts[0].startsWith('1970-')) {
      // usar solo la parte horaria
      const time = parts[1];
      // cortar segundos si vienen
      return time.split(':').slice(0, 2).join(':');
    }

    // Si viene como ISO con fecha yyyy-MM-ddTHH:MM:SS, intentar extraer hora
    if (withoutDotZero.includes('T')) {
      const tparts = withoutDotZero.split('T');
      const time = tparts[1] || tparts[0];
      return time.split(':').slice(0, 2).join(':');
    }

    // Si es ya una hora '17:30:00' devolver '17:30'
    if (/^\d{1,2}:\d{2}:?/.test(withoutDotZero)) {
      return withoutDotZero.split(':').slice(0, 2).join(':');
    }

    // fallback
    return withoutDotZero;
  }

  // Normaliza una cadena para extraer HH:MM si existe, o devuelve null
  normalizeToHHMM(input?: string | null): string | null {
    if (!input) return null;
    const s = input.toString();
    const m = /(?:(\d{1,2}):(\d{2}))/.exec(s);
    if (!m) return null;
    const hh = m[1].padStart(2, '0');
    const mm = m[2];
    return `${hh}:${mm}`;
  }

  // Refresca los slots mostrados en el formulario de creación según la fecha seleccionada y la mesa del modal
  refreshCreateSlots() {
    if (!this.modalMesa) return;
    this.loadingTimes = true;
    // generar slots base
    this.createTimeSlots = this.generateTimeSlots(8, 22, 60);
    // limpiar set antes de pedir
    this.reservedSlotSet.clear();
    const fechaForApi = this.selectedDateIso ? this.formatIsoToDdMmYyyy(this.selectedDateIso) : undefined;
    this.reservasService.getMesasDisponibles(this.modalMesa.idTable, fechaForApi).subscribe({
      next: (resp) => {
        this.availableTimes = Array.isArray(resp) ? resp : [];
        // construir set de horas reservadas
        for (const r of this.availableTimes) {
          const rawLabel = this.formatSlotLabel(r);
          const norm = this.normalizeToHHMM(rawLabel);
          if (norm) this.reservedSlotSet.add(norm);
        }
        // Quitar de la lista de slots las horas ya reservadas Y las horas pasadas
        if (this.createTimeSlots && this.createTimeSlots.length > 0) {
          this.createTimeSlots = this.createTimeSlots.filter(t =>
            !this.reservedSlotSet.has(t) && !this.isTimePast(t)
          );
        }
        // Limpiar cualquier selección en detalles que ya se vuelva reservada
        for (const d of this.createForm.detallesRequest) {
          if (d.hourReservation) {
            const curNorm = this.normalizeToHHMM(d.hourReservation);
            if (curNorm && this.reservedSlotSet.has(curNorm)) {
              d.hourReservation = '';
            }
          }
        }
        this.loadingTimes = false;
      },
      error: (err) => {
        console.error('Error obteniendo horarios para creación', err);
        this.loadingTimes = false;
        this.availableTimes = [];
        this.reservedSlotSet.clear();
      }
    });
  }

  closeModal() {
    this.showModal = false;
    this.modalMesa = null;
    this.reservedTimes = [];
    this.reservedLoading = false;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeHandler(event: Event) {
    // event may be generic Event; close modal on Escape
    if (this.showModal) {
      this.closeModal();
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = 'https://via.placeholder.com/80';
    }
  }

  getMesaCapacity(tableId?: number): number | undefined {
    if (!tableId) return undefined;
    const mesa = this.mesas.find(m => m.idTable === tableId);
    return mesa?.ability;
  }

  isMesaReserved(tableId?: number, hour?: string): boolean {
    if (!tableId || !hour) return false;
    const norm = this.normalizeToHHMM(hour);
    if (!norm) return false;
    return !!this.reservedSetsByMesa[tableId]?.has(norm);
  }

  isSlotReservedForMesa(tableId?: number, slot?: string): boolean {
    if (!tableId || !slot) return false;
    return !!this.reservedSetsByMesa[tableId]?.has(slot);
  }

  isTimePast(hourStr: string): boolean {
    // Check if the time slot is in the past for the selected date
    if (!hourStr) return false;

    const selectedDate = this.selectedDateIso
      ? new Date(this.selectedDateIso + 'T00:00:00')
      : new Date();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // If the selected date is in the future, no time is past
    if (selectedDate > today) {
      return false;
    }

    // If the date is today, check if the hour is in the past
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      const parts = hourStr.split(':');
      if (parts.length >= 2) {
        const slotHour = parseInt(parts[0], 10);
        const slotMinutes = parseInt(parts[1], 10);
        const slotTime = slotHour * 60 + slotMinutes;
        const nowTime = currentHour * 60 + currentMinutes;

        return slotTime <= nowTime;
      }
    }

    // If the date is in the past, all times are past
    return selectedDate < today;
  }

  filterAvailableTimeSlots(slots: string[]): string[] {
    // Filter out past times and reserved times
    return slots.filter(slot => {
      const norm = this.normalizeToHHMM(slot) || slot;
      return !this.reservedSlotSet.has(norm) && !this.isTimePast(slot);
    });
  }
}
