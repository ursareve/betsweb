import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ListColumn } from '../../../@fury/shared/list/list-column.model';
import { UserCreateUpdateComponent } from './user-create-update/user-create-update.component';
import { User } from '../../models/user.model';
import { UserService, UserWithOnlineStatus } from '../../core/services/user.service';
import { fadeInRightAnimation } from '../../../@fury/animations/fade-in-right.animation';
import { fadeInUpAnimation } from '../../../@fury/animations/fade-in-up.animation';
import { SweetAlertService } from '../../services/sweet-alert.service';

@Component({
  selector: 'fury-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  animations: [fadeInRightAnimation, fadeInUpAnimation]
})
export class UsersComponent implements OnInit, AfterViewInit {

  @Input()
  columns: ListColumn[] = [
    { name: 'Checkbox', property: 'checkbox', visible: false },
    { name: 'Avatar', property: 'image', visible: true },
    { name: 'Nombres', property: 'firstName', visible: true, isModelProperty: true },
    { name: 'Apellidos', property: 'lastName', visible: true, isModelProperty: true },
    { name: 'Email', property: 'email', visible: true, isModelProperty: true },
    { name: 'Documento', property: 'document', visible: true, isModelProperty: true },
    { name: 'Género', property: 'gender', visible: true, isModelProperty: true },
    { name: 'Rol', property: 'role', visible: true, isModelProperty: true },
    { name: 'Estado', property: 'active', visible: true, isModelProperty: true },
    { name: 'Activo Hasta', property: 'activeUntil', visible: true, isModelProperty: true },
    { name: 'Acciones', property: 'actions', visible: true },
  ] as ListColumn[];
  pageSize = 10;
  dataSource: MatTableDataSource<UserWithOnlineStatus> | null;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private alert: SweetAlertService
  ) {}

  get visibleColumns() {
    return this.columns.filter(column => column.visible).map(column => column.property);
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource();
    
    // Suscribirse al observable para recibir actualizaciones
    this.userService.users$.subscribe(
      users => {
        if (users.length > 0) {
          console.log('Usuarios actualizados:', users);
          this.dataSource.data = users;
        }
      }
    );
    
    // Cargar usuarios (usará caché si existe, sino hará HTTP)
    this.userService.loadUsers().subscribe();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers() {
    this.userService.refreshUsers().subscribe(
      users => {
        console.log('Usuarios recargados:', users);
        this.dataSource.data = users;
      },
      error => {
        this.alert.error('Error', 'Error al cargar usuarios');
      }
    );
  }

  createUser() {
    this.dialog.open(UserCreateUpdateComponent).afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const { avatarFile, ...userData } = result;
          const createdUser = await this.userService.createUser(userData);
          
          if (avatarFile) {
            const avatarUrl = await this.userService.uploadAvatar(avatarFile, createdUser.uid);
            await this.userService.updateUser(createdUser.uid, { avatarUrl });
          }
          
          this.alert.success('Creado', 'Usuario creado exitosamente');
          this.loadUsers();
        } catch (error: any) {
          this.alert.error('Error', 'Error al crear usuario: ' + error.message);
        }
      }
    });
  }

  updateUser(user: User) {
    this.dialog.open(UserCreateUpdateComponent, {
      data: user
    }).afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          const { avatarFile, password, email, ...userData } = result;
          
          if (avatarFile) {
            try {
              const avatarUrl = await this.userService.uploadAvatar(avatarFile, user.uid);
              userData.avatarUrl = avatarUrl;
            } catch (uploadError: any) {
              console.error('Error al subir imagen:', uploadError);
              this.alert.warning('Advertencia', 'Usuario actualizado pero la imagen no se pudo subir');
            }
          }
          
          await this.userService.updateUser(user.uid, userData);
          this.alert.success('Actualizado', 'Usuario actualizado exitosamente');
          this.loadUsers();
        } catch (error: any) {
          this.alert.error('Error', 'Error al actualizar usuario: ' + error.message);
        }
      }
    });
  }

  deleteUser(user: User) {
    this.alert.confirmDelete(
      '¿Eliminar usuario?',
      `Se eliminará a ${user.firstName} ${user.lastName}`
    ).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(user.uid).then(() => {
          this.alert.success('Eliminado', 'Usuario eliminado exitosamente');
          this.loadUsers();
        }).catch(error => {
          this.alert.error('Error', 'Error al eliminar usuario: ' + error.message);
        });
      }
    });
  }

  onFilterChange(value: string) {
    if (!this.dataSource) {
      return;
    }
    value = value.trim();
    value = value.toLowerCase();
    this.dataSource.filter = value;
  }

  getStatusLabel(active: boolean): string {
    return active ? 'Activo' : 'Inactivo';
  }

  getAvatarUrl(user: UserWithOnlineStatus): string {
    return user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
  }

  formatDate(date: any): string {
    if (!date) return '-';
    
    // Si es un Timestamp de Firestore
    if (date.seconds) {
      const d = new Date(date.seconds * 1000);
      return d.toLocaleDateString('es-ES');
    }
    
    // Si es una fecha normal
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-ES');
  }

  toggleUserStatus(user: User, newStatus: boolean): void {
    const action = newStatus ? 'activar' : 'desactivar';
    
    this.alert.confirm(
      `¿${newStatus ? 'Activar' : 'Desactivar'} usuario?`,
      `Se ${action}á a ${user.firstName} ${user.lastName}`,
      `Sí, ${action}`
    ).then((result) => {
      if (result.isConfirmed) {
        this.userService.toggleUserStatus(user.uid, newStatus).then(() => {
          this.alert.success(
            newStatus ? 'Usuario activado' : 'Usuario desactivado',
            `${user.firstName} ${user.lastName} ha sido ${newStatus ? 'activado' : 'desactivado'}`
          );
          this.loadUsers();
        }).catch(error => {
          this.alert.error('Error', 'Error al cambiar estado: ' + error.message);
          this.loadUsers();
        });
      } else {
        this.loadUsers();
      }
    });
  }

  resetPassword(user: User) {
    this.alert.confirm(
      '¿Restablecer contraseña?',
      `Se enviará un correo a ${user.email}`,
      'Sí, enviar'
    ).then((result) => {
      if (result.isConfirmed) {
        this.userService.resetPassword(user.email).then(() => {
          this.alert.success('Enviado', 'Correo de restablecimiento enviado exitosamente');
        }).catch(error => {
          this.alert.error('Error', 'Error al enviar correo: ' + error.message);
        });
      }
    });
  }

  forceLogoutUser(user: User) {
    this.alert.confirm(
      '¿Forzar cierre de sesión?',
      `Se cerrarán TODAS las sesiones de ${user.firstName} ${user.lastName} y se revocarán sus tokens`,
      'Sí, forzar logout'
    ).then((result) => {
      if (result.isConfirmed) {
        this.userService.forceLogoutUser(user.uid).then(() => {
          this.alert.success('Logout forzado', 'Usuario desconectado exitosamente');
          this.loadUsers();
        }).catch(error => {
          this.alert.error('Error', 'Error al forzar logout: ' + error.message);
        });
      }
    });
  }
}
