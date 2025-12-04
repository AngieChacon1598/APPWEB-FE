export interface TypeUsers {
  idTypeUsers: number;
  name: string;
}

export interface RestaurantUser extends BaseUser {
  idUser: number;
  state: string;
  typeUsersIdTypeUsers: TypeUsers;
}

export interface BaseUser {
  userName: string;
  password: string;
  names: string;
  lastName: string;
  birthDate: string;
  address: string;
  email: string;
  typeDocument: string;
  numberDocument: string;
}

export interface UsuarioRequest extends BaseUser {
  role: string; // CLIENTE, EMPLEADO, ADMIN
}

export interface UsuarioBackendRequest {
  username: string;
  password: string;
  names: string;
  lastName: string;
  birthDate: string;
  address: string;
  email: string;
  typeDocument: string;
  numberDocument: string;
  role: string;
}

export interface PageRestaurantUser {
  page: number;
  size: number;
  content: RestaurantUser[];
  totalElements: number;
  totalPages: number;
}


export interface Category {
  categoryId: number;
  name: string;
  description: string;
  state: string; // "1" = activo, "0" = inactivo
  createdAt: string;
}

export interface Product {
  menuId: number;
  imagenUrl: string;
  name: string;
  description: string;
  price: number;
  state: number; // 1 = activo, 0 = inactivo
  categoryId: number;
  createdAt: string;
  updatedAt: string | null;
  category?: Category;
}

export interface PageProduct {
  page: number;
  size: number;
  content: Product[];
  totalElements: number;
  totalPages: number;
}
