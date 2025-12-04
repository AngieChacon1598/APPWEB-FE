export interface MesaRestaurante {
  idTable: number;
  numberTable: number;
  ability: number;
  descripcion?: string;
  imagen?: string; // URL de la imagen enviada por backend
  state: string; // "A" = Activo, "I" = Inactivo
}

export interface MesaRestaurantRequest {
  numberTable: number;
  ability: number;
  descripcion?: string;
  imagen?: string; // enviar la URL de la imagen como 'imagen'
}

export interface MesaResponse {
  status: boolean;
  mensaje: string;
  content: MesaRestaurante[] | null;
}
