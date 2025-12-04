/**
 * Clase base para errores personalizados de la aplicación
 */
export class AppError extends Error {
  public readonly timestamp: Date;
  public readonly statusCode: number;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.statusCode = statusCode;
    this.errorCode = errorCode;

    // Mantener la cadena de prototipo correcta para instanceof
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error de validación (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Error de validación', errorCode?: string) {
    super(message, 400, errorCode);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error de autenticación (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Credenciales inválidas', errorCode?: string) {
    super(message, 401, errorCode);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error de autorización (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'No está autorizado', errorCode?: string) {
    super(message, 403, errorCode);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Error de recurso no encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado', errorCode?: string) {
    super(message, 404, errorCode);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error de servidor (500)
 */
export class ServerError extends AppError {
  constructor(message: string = 'Error en el servidor', errorCode?: string) {
    super(message, 500, errorCode);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error de conexión (0 o sin conexión)
 */
export class NetworkError extends AppError {
  constructor(
    message: string = 'Error de conexión. Verifique que el servidor esté ejecutándose.',
    errorCode?: string
  ) {
    super(message, 0, errorCode);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error de negocio personalizado
 */
export class BusinessError extends AppError {
  constructor(message: string, errorCode?: string) {
    super(message, 422, errorCode);
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

/**
 * Error de conflicto (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto en la solicitud', errorCode?: string) {
    super(message, 409, errorCode);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
