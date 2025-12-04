import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tables-components',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tables-components.html',
  styleUrl: './tables-components.scss'
})
export class TablesComponents {

  @Input() columns: { field: string, header: string }[] = [];
  @Input() data: any[] = [];
  @Input() showActiveUsers: boolean = true;
  @Input() canManage: boolean = true; // Nuevo input para controlar permisos
  @Input() canManageEdit: boolean = true; // Nuevo input para controlar permisos

  @Output() inactivar = new EventEmitter<number>();
  @Output() editar = new EventEmitter<any>();
  @Output() observar = new EventEmitter<any>();

  @Input() idTdable!: any;

  onInactive(row: any) {
    const id = row[this.idTdable]
    this.inactivar.emit(id);
  }

  onEdit(row: any) {
    this.editar.emit(row);
  }

  onView(row: any) {
    this.observar.emit(row);
  }

  onImageError(event: any) {
    console.log('Error cargando imagen:', event);
    // Cambiar la imagen a un placeholder o imagen por defecto
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCAyOEMyNi4yMDkxIDI4IDI4IDI2LjIwOTEgMjggMjRDMjggMjEuNzkwOSAyNi4yMDkxIDIwIDI0IDIwQzIxLjc5MDkgMjAgMjAgMjEuNzkwOSAyMCAyNEMyMCAyNi4yMDkxIDIxLjc5MDkgMjggMjQgMjhaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
    event.target.alt = 'Imagen no disponible';
  }
}
