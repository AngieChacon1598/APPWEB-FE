// Interfaces para SalesTicket

export interface ProductDetailDTO {
  idDetailProduct: number;
  menuId: number;
  menuName: string;
  menuPrice: number;
  amount: number; // Cantidad
  ticketId: number;
  menu?: MenuDTO;
}

export interface MenuDTO {
  menuId: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  state: number;
}

export interface SalesTicketDTO {
  ticketId: number;
  saleDate: string; // ISO 8601 format: "2024-01-15T10:30:00"
  totalPayment: number;
  delivery: string; // "SI" o "NO"
  deliveryAddress?: string;
  note?: string;
  state: string; // "A" (Activo) o "I" (Inactivo)
  orderStatus: string; // Nombre del estado de la orden
  paymentType: string; // Nombre del tipo de pago
  userId: number;
  userName?: string;
  idTypeState: number;
  stateName?: string;
  idPaymentType: number;
  paymentTypeName?: string;
  productDetails: ProductDetailDTO[];
}

export interface ProductDetail {
  idDetailProduct?: number;
  amount: number;
  menuId: number;
  ticketId?: number;
}

export interface SalesTicket {
  ticketId?: number; // Solo para actualizaciones
  saleDate?: string; // Se genera automáticamente si no se proporciona
  totalPayment: number;
  delivery: string; // "SI" o "NO"
  deliveryAddress?: string;
  note?: string;
  userId: number;
  idTypeState: number;
  idPaymentType: number;
  state?: string; // "A" por defecto
  productDetails?: ProductDetail[];
}

export interface SalesTicketPage {
  content: SalesTicketDTO[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface SalesTicketFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  delivery?: string;
  userId?: number;
  userName?: string; // Búsqueda por nombre de usuario
  paymentType?: string; // Tipo de pago
  minAmount?: number; // Monto mínimo
  maxAmount?: number; // Monto máximo
  page?: number;
  size?: number;
}

export interface SalesTicketResponse {
  status: boolean;
  mensaje: string;
  content?: SalesTicketDTO | SalesTicketDTO[] | SalesTicketPage;
}
