export interface ApiResponse<T> {
  status: boolean;
  mensaje: string;
  content: T;
}
