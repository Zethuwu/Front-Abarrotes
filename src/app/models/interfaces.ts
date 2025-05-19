export interface Factura {
  id: number;
  activa: boolean;
  fecha: Date;
  total: number;
  cliente_id: number;
  usuario_id: number;
  detalles?: DetalleFactura[];
  cliente?: Cliente;
  usuario?: Usuario;
}

export interface Rol {
  id: number;
  nombre: string;
  usuarios?: Usuario[];
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

export interface InventarioDTO {
  id: number;
  cantidadActual: number;
  cantidadInicial: number;
  minimoRequerido: number;
  producto_id: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  password: string;
  username: string;
  roles?: Rol[];
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
  precio_unitario: number;
  factura_id: number;
  producto_id: number;
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

export interface CorteCajaDTO{
  nombreProducto: string;
  cantidadVendida: number;
}
