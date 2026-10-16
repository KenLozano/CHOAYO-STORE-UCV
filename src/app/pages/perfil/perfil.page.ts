import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonToggle
} from '@ionic/angular/standalone';

import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';

import {
  personOutline,
  shieldCheckmarkOutline,
  notificationsOutline,
  logOutOutline,
  chevronForwardOutline,
  chevronDownOutline,
  star,
  logoWhatsapp,
  documentTextOutline,
  helpCircleOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  moon, // AGREGADO PARA MODO OSCURO
  sunny // AGREGADO PARA MODO CLARO
} from 'ionicons/icons';

import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonButton,
    IonToggle,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class PerfilPage implements OnInit {

  usuario: any = {
    nombre: 'Cargando...',
    correo: '',
    puntos: 0,
    nivel: 'ORO'
  };

  mostrarAvatares = false;
  mostrarModalPassword = false;
  mostrarNotificaciones = false;

  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;

  avatarSeleccionado: string | null =
    localStorage.getItem('avatarSeleccionado');

  nuevaPassword = '';
  confirmarPassword = '';
  mensajePassword = '';

  esModoOscuro = false; // VARIABLE PARA MODO OSCURO

  alertas = {
    productos: true,
    promociones: true,
    premios: true
  };

  avatares: string[] = [
    'assets/avatars/Avatar J-Hope.png',
    'assets/avatars/Avatar Jennie Kim.png',
    'assets/avatars/Avatar Jisoo.png',
    'assets/avatars/Avatar Kim Namjoon.png',
    'assets/avatars/Avatar Kim Seok-Jin.png',
    'assets/avatars/Avatar Kim Tae Hyung.png',
    'assets/avatars/Avatar Rosé.png',
    'assets/avatars/Avatar Suga.png',
    'assets/avatars/Avatar_Lisa.png',
    'assets/avatars/Avatar Jungkook.png',
    'assets/avatars/Avattar Jimin.png'
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    addIcons({
      personOutline,
      shieldCheckmarkOutline,
      notificationsOutline,
      logOutOutline,
      chevronForwardOutline,
      chevronDownOutline,
      star,
      logoWhatsapp,
      documentTextOutline,
      helpCircleOutline,
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      moon, // REGISTRADO
      sunny // REGISTRADO
    });
  }

  ngOnInit() {
    this.cargarPerfil();
    this.avatarSeleccionado = localStorage.getItem('avatarSeleccionado');
    this.comprobarTema(); // VERIFICA EL TEMA AL INICIAR

    const prefsGuardadas = localStorage.getItem('alertasChoayo');

    if (prefsGuardadas) {
      this.alertas = JSON.parse(prefsGuardadas);
    }
  }

  ionViewWillEnter() {
    this.cargarPerfil();
    this.avatarSeleccionado = localStorage.getItem('avatarSeleccionado');
    this.comprobarTema(); // VERIFICA EL TEMA AL ENTRAR A LA VISTA
  }

  // --- LÓGICA DE TEMA CLARO / OSCURO ---
  comprobarTema() {
    const temaGuardado = localStorage.getItem('choayo_tema');
    if (temaGuardado === 'dark') {
      this.esModoOscuro = true;
      document.body.classList.add('dark');
    } else if (temaGuardado === 'light') {
      this.esModoOscuro = false;
      document.body.classList.remove('dark');
    } else {
      const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.esModoOscuro = prefiereOscuro;
      if (prefiereOscuro) document.body.classList.add('dark');
    }
  }

  toggleTema() {
    this.esModoOscuro = !this.esModoOscuro;
    if (this.esModoOscuro) {
      document.body.classList.add('dark');
      localStorage.setItem('choayo_tema', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('choayo_tema', 'light');
    }
  }
  // -------------------------------------

  get passwordTieneMinimo(): boolean {
    return this.nuevaPassword.length >= 8;
  }

  get passwordTieneLetras(): boolean {
    return /[A-Za-z]/.test(this.nuevaPassword);
  }

  get passwordTieneNumeros(): boolean {
    return /\d/.test(this.nuevaPassword);
  }

  get passwordsCoinciden(): boolean {
    return (
      this.confirmarPassword.length > 0 &&
      this.nuevaPassword === this.confirmarPassword
    );
  }

  get formularioPasswordValido(): boolean {
    return (
      this.passwordTieneMinimo &&
      this.passwordTieneLetras &&
      this.passwordTieneNumeros &&
      this.passwordsCoinciden
    );
  }

  async cargarPerfil() {
    try {
      const userAuth = await this.supabaseService.getUsuarioActual();

      if (!userAuth) {
        return;
      }

      const perfil = await this.supabaseService.getPerfilUsuario(userAuth.id);

      if (perfil) {
        this.usuario = {
          nombre: perfil.nombre,
          correo: perfil.correo_electronico,
          puntos: perfil.puntos_totales,
          nivel: 'ORO'
        };
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  }

  seleccionarAvatar(avatar: string) {
    this.avatarSeleccionado = avatar;
    localStorage.setItem('avatarSeleccionado', avatar);
    this.mostrarAvatares = false;
  }

  subirFotoUsuario(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const archivo = input.files[0];
    const lector = new FileReader();

    lector.onload = () => {
      this.avatarSeleccionado = lector.result as string;

      localStorage.setItem(
        'avatarSeleccionado',
        this.avatarSeleccionado
      );

      this.mostrarAvatares = false;
    };

    lector.readAsDataURL(archivo);
  }

  eliminarFotoPerfil() {
    localStorage.removeItem('avatarSeleccionado');
    this.avatarSeleccionado = null;
  }

  abrirWhatsApp() {
    window.open(
      'https://wa.me/51900475375?text=Hola%20CHOAYO%20STORE,%20quiero%20hacer%20una%20consulta',
      '_blank'
    );
  }

  async cerrarSesion() {
    try {
      await this.supabaseService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async cambiarContrasena() {
    if (!this.formularioPasswordValido) {
      this.mensajePassword = 'Revisa los requisitos antes de guardar.';
      return;
    }

    this.mensajePassword = 'Actualizando...';

    const result = await this.supabaseService.actualizarPassword(
      this.nuevaPassword
    );

    if (result?.error) {
      this.mensajePassword = 'Error al actualizar. Intenta de nuevo.';
    } else {
      this.mensajePassword = '¡Contraseña actualizada con éxito!';

      setTimeout(() => {
        this.cerrarModalPassword();
      }, 1800);
    }
  }

  cerrarModalPassword() {
    this.mostrarModalPassword = false;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.mensajePassword = '';
    this.mostrarNuevaPassword = false;
    this.mostrarConfirmarPassword = false;
  }

  guardarPreferenciasNotificaciones() {
    localStorage.setItem(
      'alertasChoayo',
      JSON.stringify(this.alertas)
    );
  }
}