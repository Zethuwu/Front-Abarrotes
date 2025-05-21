import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo agrega withCredentials a peticiones a tu API
    if (req.url.startsWith('http://localhost:8081')) {
      const cloned = req.clone({ withCredentials: true });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}