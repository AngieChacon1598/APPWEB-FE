import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, OnChanges, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-forms-components',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forms-components.html',
  styleUrl: './forms-components.scss'
})
export class FormsComponents implements OnInit, OnChanges {


  @Input() tituloFormulario!: string;
  @Input() campos: { nombre: string, tipo: string, etiqueta: string, opciones?: any[] }[] = [];
  @Input() datosIniciales: any = null;

  @Output() guardar = new EventEmitter<any>();
  @Output() cerrar = new EventEmitter<any>();
  @Output() limpiar = new EventEmitter<any>();

  formulario!: FormGroup;
  private readonly fb = inject(FormBuilder);

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    if (this.formulario && this.datosIniciales) {
      this.cargarDatos();
    }
  }

  initForm() {
    const group: any = {};
    this.campos.forEach(campo => {
      // Aplicar validaciones según el tipo de campo
      const validators = this.getValidatorsForField(campo);
      group[campo.nombre] = ['', validators];
    });
    this.formulario = this.fb.group(group);
    
    if (this.datosIniciales) {
      this.cargarDatos();
    }
  }

  getValidatorsForField(campo: any): any[] {
    const validators: any[] = [];
    
    // Validaciones específicas por nombre de campo
    switch (campo.nombre) {
      case 'name':
        validators.push(Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(/^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑ]{3,})[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.]+$/));
        break;
      case 'description':
        validators.push(Validators.required, Validators.minLength(10), Validators.maxLength(500), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.,!?]+$/));
        break;
      case 'price':
        validators.push(Validators.required, Validators.min(1), Validators.max(9999.99));
        break;
      case 'imagenUrl':
        validators.push(Validators.required, Validators.pattern(/^https?:\/\/.+/));
        break;
      case 'categoryId':
        validators.push(Validators.required);
        break;
      case 'userName':
        validators.push(Validators.required, Validators.minLength(3), Validators.maxLength(50));
        break;
      case 'password':
        validators.push(Validators.required, Validators.minLength(6));
        break;
      case 'names':
        validators.push(Validators.required, Validators.minLength(2), Validators.maxLength(50));
        break;
      case 'lastName':
        validators.push(Validators.required, Validators.minLength(2), Validators.maxLength(50));
        break;
      case 'email':
        validators.push(Validators.required, Validators.email);
        break;
      case 'numberDocument':
        validators.push(Validators.required, Validators.pattern(/^[0-9]{7,12}$/));
        break;
      case 'address':
        validators.push(Validators.required, Validators.minLength(10), Validators.maxLength(200));
        break;
      case 'birthDate':
        validators.push(Validators.required);
        break;
      case 'numberTable':
        validators.push(Validators.required, Validators.min(1), Validators.max(999));
        break;
      case 'ability':
        validators.push(Validators.required, Validators.min(1), Validators.max(20));
        break;
      default:
        // Para campos no específicos, solo requerido si es necesario
        if (campo.tipo === 'select' || campo.tipo === 'number') {
          validators.push(Validators.required);
        }
        break;
    }
    
    return validators;
  }

  cargarDatos() {
    if (this.datosIniciales && this.formulario) {
      // Convertir fecha de dd/MM/yyyy a yyyy-MM-dd para el input date
      const datos = { ...this.datosIniciales };
      if (datos.birthDate) {
        const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(datos.birthDate);
        if (match) {
          const dd = match[1];
          const mm = match[2];
          const yyyy = match[3];
          datos.birthDate = `${yyyy}-${mm}-${dd}`;
        }
      }
      
      this.formulario.patchValue(datos);
    }
  }

  onGuardar() {
    if (this.formulario.valid) {
      this.guardar.emit(this.formulario.value);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      this.formulario.markAllAsTouched();
      console.log('❌ Formulario inválido:', this.formulario.errors);
    }
  }

  onClose() {
    this.formulario.reset();
    this.cerrar.emit()
  }

  onlimpiar() {
    this.formulario.reset();
    this.limpiar.emit();
  }

  // Método para obtener mensajes de error específicos
  getErrorMessage(fieldName: string): string {
    const field = this.formulario.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} no puede tener más de ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} debe ser mayor a ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${this.getFieldLabel(fieldName)} no puede ser mayor a ${field.errors['max'].max}`;
      }
      if (field.errors['email']) {
        return 'Ingresa un email válido';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'imagenUrl') {
          return 'Debe ser una URL válida (http:// o https://)';
        }
        if (fieldName === 'numberDocument') {
          return 'Debe contener entre 7 y 12 dígitos';
        }
        if (fieldName === 'name') {
          return 'Debe contener al menos 3 letras consecutivas (se permiten números y puntos)';
        }
        if (fieldName === 'description') {
          return 'Solo se permiten letras, espacios y signos de puntuación (sin números)';
        }
        return 'Formato inválido';
      }
    }
    return '';
  }

  // Método para obtener la etiqueta del campo
  getFieldLabel(fieldName: string): string {
    const campo = this.campos.find(c => c.nombre === fieldName);
    return campo ? campo.etiqueta : fieldName;
  }

  // Método para verificar si un campo tiene error
  hasError(fieldName: string): boolean {
    const field = this.formulario.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Método para precargar imagen cuando se ingresa URL
  onImageUrlChange(event: any) {
    const url = event.target.value;
    if (url && this.isValidUrl(url)) {
      // Crear elemento de imagen para precargar
      const img = new Image();
      img.onload = () => {
        console.log('✅ Imagen cargada exitosamente:', url);
        // Aquí podrías mostrar un indicador de éxito
      };
      img.onerror = () => {
        console.log('❌ Error cargando imagen:', url);
        // Aquí podrías mostrar un indicador de error
      };
      img.src = url;
    }
  }

  // Método para validar URL
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  // Método para manejar carga exitosa de imagen
  onImageLoad(event: any) {
    console.log('✅ Vista previa de imagen cargada exitosamente');
    // Aquí podrías agregar indicadores visuales de éxito
  }

  // Método para manejar error de carga de imagen
  onImageError(event: any) {
    console.log('❌ Error cargando vista previa de imagen');
    // Aquí podrías mostrar un placeholder o mensaje de error
    event.target.style.display = 'none';
  }

}
