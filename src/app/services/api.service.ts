import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { FormGroup } from '@angular/forms';
import {
  Producto,
  InventarioDTO,
  Proveedor,
  Cliente,
  Factura,
  DetalleFactura,
  Usuario,
  Rol,
  CorteCajaDTO
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Productos
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/product-service/products`);
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/product-service/${id}`);
  }

  createProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/product-service/create`, producto, { withCredentials: true });
  }

  updateProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/product-service/update/${id}`, producto, { withCredentials: true });
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/product-service/delete/${id}`, { withCredentials: true });
  }

  enviarProductosRequeridos(productosRequeridos: { productoId: number, cantidadRequerida: number }[]) {
    return this.http.post(`${this.apiUrl}/export-service/required-products`, productosRequeridos, { responseType: 'text' });
  }

  // Proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/supplier-service/suppliers`, { withCredentials: true });
  }

  getProveedor(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/supplier-service/find-by-id/${id}`);
  }

  createProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.apiUrl}/supplier-service/create`, proveedor);
  }

  updateProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/supplier-service/update/${id}`, proveedor);
  }

  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/supplier-service/delete/${id}`);
  }

  // Clientes
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/client-service/clients`, { withCredentials: true });
  }

  getCliente(nombre: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/client-service/find-by-name/${nombre}`, { withCredentials: true });
  }

  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/client-service/create`, cliente, { withCredentials: true });
  }

  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/client-service/${id}`, cliente);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/client-service/delete-id/${id}`, { withCredentials: true });
  }

  // Facturas
  getFacturas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/invoice-service/invoices`, { withCredentials: true });
  }

  getFacturasByCliente(nombre: string): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/invoice-service/client-invoices/${nombre}`, {
      withCredentials: true
    });
  }

  getFacturasByUsuario(nombre: string): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/invoice-service/user-invoices/${nombre}`, {
      withCredentials: true
    });
  }


  getFactura(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/invoice-service/${id}`, { withCredentials: true });
  }

  createFactura(factura: Factura): Observable<Factura> {
    return this.http.post<Factura>(`${this.apiUrl}/invoice-service/create`, factura, { withCredentials: true });
  }

  updateFactura(id: number, factura: Factura): Observable<Factura> {
    return this.http.put<Factura>(`${this.apiUrl}/invoice-service/${id}`, factura);
  }

  deleteFactura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/invoice-service/delete/${id}`);
  }

  enviarFactura(id: number): Observable<string> {
  return this.http.post(`${this.apiUrl}/export-service/send-invoice/${id}`, {}, {
    withCredentials: true,
    responseType: 'text'
  });
}

  // Usuarios
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/user-service/users`);
  }

  getUsuario(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/usuarios/${id}`);
  }

  createUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/usuarios`, usuario);
  }

  updateUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/usuarios/${id}`, usuario);
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuarios/${id}`);
  }

  getUsuarioByUsername(username: string) {
    return this.http.get<Usuario>(`${this.apiUrl}/user-service/find-by-username/${username}`);
  }

  // Roles
  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  createInventario(inventario: InventarioDTO): Observable<InventarioDTO> {
    return this.http.post<InventarioDTO>(`${this.apiUrl}/inventario`, inventario)
  }

  //Corte de caja
  getCorteDeCajaPorFecha(fecha: string): Observable<CorteCajaDTO[]> {
    return this.http.get<CorteCajaDTO[]>(`${this.apiUrl}/audit-service/date/${fecha}`);
  }

  uploadProductoImage(productoId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<any>(`${this.apiUrl}/product-service/products/${productoId}/image`, formData, { withCredentials: true });
  }
}
