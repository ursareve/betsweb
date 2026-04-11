import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {

  success(title: string, text?: string, timer: number = 2000) {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer,
      showConfirmButton: false
    });
  }

  error(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title,
      text
    });
  }

  warning(title: string, text?: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text
    });
  }

  info(title: string, text?: string) {
    return Swal.fire({
      icon: 'info',
      title,
      text
    });
  }

  confirm(title: string, text: string, confirmButtonText: string = 'Sí, confirmar') {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText,
      cancelButtonText: 'Cancelar'
    });
  }

  confirmDelete(title: string, text: string) {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  }

  toast(icon: SweetAlertIcon, title: string, timer: number = 3000) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer,
      timerProgressBar: true
    });
  }
}
