import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonCheckbox } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  logoGoogle,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonCheckbox, CommonModule, RouterModule, FormsModule]
})
export class LoginPage implements OnInit {

  passwordType: string = 'password';
  passwordIcon: string = 'eye-outline';

  email: string = '';
  password: string = '';
  errorMsg: string = '';
  cargando: boolean = false;

  // --- Recuperar contraseña ---
  mostrarModalRecuperar: boolean = false;
  recuperarEmail: string = '';
  mensajeRecuperar: string = '';
  cargandoRecuperar: boolean = false;
  recuperarExito: boolean = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService
  ) {
    // Un solo registro con todos los íconos necesarios
    addIcons({
      logoGoogle,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  ngOnInit() { }

  // --- Login con Google ---
  async iniciarConGoogle() {
    try {
      await this.supabaseService.loginConGoogle();
    } catch (error) {
      console.error('No se pudo completar el login con Google', error);
    }
  }

  togglePasswordMode() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    this.passwordIcon = this.passwordIcon === 'eye-outline' ? 'eye-off-outline' : 'eye-outline';
  }

  async ingresar() {
    this.errorMsg = '';

    // Validación básica
    if (!this.email || !this.password) {
      this.errorMsg = 'Por favor completa todos los campos.';
      return;
    }

    this.cargando = true;
    const resultado = await this.supabaseService.login(this.email, this.password);
    this.cargando = false;

    if (resultado) {
      this.router.navigate(['/tabs/home']);
    } else {
      this.errorMsg = 'Correo o contraseña incorrectos.';
    }
  }

  abrirModalRecuperar() {
    this.mostrarModalRecuperar = true;
    this.recuperarEmail = '';
    this.mensajeRecuperar = '';
    this.recuperarExito = false;
  }

  cerrarModalRecuperar() {
    this.mostrarModalRecuperar = false;
    this.recuperarEmail = '';
    this.mensajeRecuperar = '';
    this.recuperarExito = false;
  }

  async enviarRecuperacion() {
    this.mensajeRecuperar = '';

    if (!this.recuperarEmail) {
      this.mensajeRecuperar = 'Ingresa tu correo electrónico.';
      return;
    }

    this.cargandoRecuperar = true;
    const resultado = await this.supabaseService.recuperarContrasena(this.recuperarEmail);
    this.cargandoRecuperar = false;

    if (resultado.success) {
      this.recuperarExito = true;
      this.mensajeRecuperar = 'Si el correo existe, te enviamos un enlace. Revisa tu bandeja (y spam).';
    } else {
      this.mensajeRecuperar = 'Ocurrió un error. Intenta de nuevo.';
    }
  }
}