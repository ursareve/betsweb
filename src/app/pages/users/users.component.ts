import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ListColumn } from '../../../@fury/shared/list/list-column.model';
import { UserCreateUpdateComponent } from './user-create-update/user-create-update.component';
import { User } from '../../models/user.model';
import { UserService } from '../../core/services/user.service';
import { fadeInRightAnimation } from '../../../@fury/animations/fade-in-right.animation';
import { fadeInUpAnimation } from '../../../@fury/animations/fade-in-up.animation';

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
    { name: 'Acciones', property: 'actions', visible: true },
  ] as ListColumn[];
  pageSize = 10;
  dataSource: MatTableDataSource<User> | null;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private snackbar: MatSnackBar
  ) {}

  get visibleColumns() {
    return this.columns.filter(column => column.visible).map(column => column.property);
  }

  ngOnInit() {
    this.dataSource = new MatTableDataSource();
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe(
      users => {
        console.log('Usuarios cargados:', users);
        this.dataSource.data = users;
      },
      error => {
        this.snackbar.open('Error al cargar usuarios', 'OK', { duration: 3000 });
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
          
          this.snackbar.open('Usuario creado exitosamente', 'OK', { duration: 3000 });
          this.loadUsers();
        } catch (error: any) {
          this.snackbar.open('Error al crear usuario: ' + error.message, 'OK', { duration: 5000 });
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
              this.snackbar.open('Usuario actualizado pero la imagen no se pudo subir', 'OK', { duration: 3000 });
            }
          }
          
          await this.userService.updateUser(user.uid, userData);
          this.snackbar.open('Usuario actualizado exitosamente', 'OK', { duration: 3000 });
          this.loadUsers();
        } catch (error: any) {
          this.snackbar.open('Error al actualizar usuario: ' + error.message, 'OK', { duration: 5000 });
        }
      }
    });
  }

  deleteUser(user: User) {
    if (confirm(`¿Está seguro de eliminar al usuario ${user.firstName} ${user.lastName}?`)) {
      this.userService.deleteUser(user.uid).then(() => {
        this.snackbar.open('Usuario eliminado exitosamente', 'OK', { duration: 3000 });
        this.loadUsers();
      }).catch(error => {
        this.snackbar.open('Error al eliminar usuario: ' + error.message, 'OK', { duration: 5000 });
      });
    }
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

  getAvatarUrl(user: User): string {
    return user.avatarUrl || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;
  }

  resetPassword(user: User) {
    if (confirm(`¿Enviar correo de restablecimiento de contraseña a ${user.email}?`)) {
      this.userService.resetPassword(user.email).then(() => {
        this.snackbar.open('Correo de restablecimiento enviado exitosamente', 'OK', { duration: 3000 });
      }).catch(error => {
        this.snackbar.open('Error al enviar correo: ' + error.message, 'OK', { duration: 5000 });
      });
    }
  }
}
