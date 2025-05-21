export interface Factura {
  id: number;
  activa: boolean;
  fecha: Date;
  total: number;
  clienteId: number;
  usuarioId: number;
  detalles?: DetalleFactura[];
  cliente?: Cliente;
  usuario?: Usuario;
}



export interface InventarioDTO {
  id: number;
  cantidadActual: number;
  cantidadInicial: number;
  minimoRequerido: number;
  producto_id: number;
}


export interface Producto {
  id: number;
  descripcion: string;
  imagen_url: string;
  nombre: string;
  precio: number;
  proveedorId: number;
  proveedor?: Proveedor;
  inventarioDTO?: InventarioDTO;
}

export interface Inventario {
  id: number;
  cantidad_actual: number;
  cantidad_inicial: number;
  minimo_requerido: number;
  producto_id: number;
  producto?: Producto;
}

export interface Usuario {
  id: number;
  nombre: string;
  password: string;
  username: string;
  roles: Rol[];
}

export interface Proveedor {
  id: number;
  correo: string;
  nombre: string;
  productos?: Producto[];
}

export interface DetalleFactura {
  id: number;
  cantidad: number;
  precioUnitario: number;
  factura_id: number;
  productoId: number;
  producto?: Producto;
  factura?: Factura;
}

export interface Cliente {
  id: number;
  apellido: string;
  email: string;
  nombre: string;
  facturas?: Factura[];
}

export interface UsuarioRol {
  usuario_id: number;
  rol_id: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export enum Rol {
  ADMIN = 'ROLE_ADMIN',
  USER = 'ROLE_USER'
}
