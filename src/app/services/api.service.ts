import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  Producto,
  InventarioDTO,
  Proveedor,
  Cliente,
  Factura,
  DetalleFactura,
  Usuario,
  Rol
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Productos
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/product-service/products`);
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/product-service/${id}`);
  }

  createProducto(producto: Producto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/product-service/create`, producto);
  }

  updateProducto(id: number, producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/product-service/${id}`, producto);
  }

  deleteProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/product-service/${id}`);
  }

  // Proveedores
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/supplier-service/suppliers`);
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
    return this.http.get<Cliente[]>(`${this.apiUrl}/client-service`);
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/client-service/${id}`);
  }

  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/client-service`, cliente);
  }

  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/client-service/${id}`, cliente);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/client-service/${id}`);
  }

  // Facturas
  getFacturas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(`${this.apiUrl}/facturas`);
  }

  getFactura(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/facturas/${id}`);
  }

  createFactura(factura: Factura): Observable<Factura> {
    return this.http.post<Factura>(`${this.apiUrl}/facturas`, factura);
  }

  updateFactura(id: number, factura: Factura): Observable<Factura> {
    return this.http.put<Factura>(`${this.apiUrl}/facturas/${id}`, factura);
  }

  deleteFactura(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/facturas/${id}`);
  }

  // Usuarios
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`);
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

  // Roles
  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  createInventario(inventario: InventarioDTO): Observable<InventarioDTO> {
    return this.http.post<InventarioDTO>(`${this.apiUrl}/inventario`, inventario)
  }
}
