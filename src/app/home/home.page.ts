import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonButton, IonModal } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { notificationsOutline, star, cafeOutline, bagOutline, ticketOutline, giftOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { SupabaseService } from '../services/supabase.service';
import { supabase } from '../../environments/supabase.config';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonButton, IonModal, CommonModule, RouterModule],
})
export class HomePage implements OnInit {

  usuario: any = { nombre: '', puntos_totales: 0 };
  isModalOpen = false;
  modalData = { titulo: '', mensaje: '', icono: '', color: '' };

  transaccionesRecientes: any[] = [];
 destacadas = [
   {

    nombre: 'Café Coreano',

    costo: 150,

    imagen: 'assets/recompensas/bebidas/Café Coreano.jpg'

  },

  {

    nombre: 'Milkis',

    costo: 200,

    imagen: 'assets/recompensas/bebidas/Milkis.jpg'

  },

  {

    nombre: 'Cupón S/5',

    costo: 600,

    imagen: 'assets/recompensas/sorpresas/Cupon 5.png'

  },

 {

    nombre: 'ChocoPie',

    costo: 220,

    imagen: 'assets/recompensas/snacks/ChocoPie.png'

  },

  {

    nombre: 'KitKat Matcha',

    costo: 320,

    imagen: 'assets/recompensas/dulces/KitKat Matcha.jpg'

  },

  {

    nombre: 'Gift Box Premium',

    costo: 2500,

    imagen: 'assets/recompensas/sorpresas/Gift Box Premium.png'

  }
];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    addIcons({ notificationsOutline, star, cafeOutline, bagOutline, ticketOutline, giftOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  async cargarDatos() {
    // Obtener usuario logueado
    const userAuth = await this.supabaseService.getUsuarioActual();

    if (!userAuth) {
      this.router.navigate(['/login']);
      return;
    }

    // Obtener perfil completo desde tabla usuarios
    const perfil = await this.supabaseService.getPerfilUsuario(userAuth.id);
    if (perfil) {
      this.usuario = perfil;
    }

    // Obtener últimos 3 movimientos del historial
    const { data, error } = await supabase
      .from('historico_puntos')
      .select('*')
      .eq('usuario_id', userAuth.id)
      .order('fecha', { ascending: false })
      .limit(3);

    if (!error && data) {
      this.transaccionesRecientes = data.map((tx: any) => {
        if (tx.fecha) {
          // 1. Forzamos a que JavaScript entienda que la fecha original está en UTC
          const fechaUTC = new Date(tx.fecha.includes('Z') ? tx.fecha : tx.fecha + 'Z');
          
          // 2. Guardamos la fecha convertida localmente
          tx.fechaFormateada = fechaUTC;
        }
        return tx;
      });
    }
  }

procesarCanje(nombreItem: string, costo: number) {
    if (this.usuario.puntos_totales >= costo) {
      // Navegamos directamente a la ruta limpia de recompensas
      this.router.navigate(['/recompensas']);
    } else {
      // Se mantiene tu diseño de modal de error si no le alcanzan los puntos
      this.modalData = {
        titulo: 'Puntos insuficientes',
        mensaje: `Necesitas <b>${costo} pts</b> para este beneficio. ¡Sigue sumando!`,
        icono: 'alert-circle-outline',
        color: 'error-color'
      };
      this.isModalOpen = true;
    }
  }

  cerrarModal() {
    this.isModalOpen = false;
  }

  irARecompensas() {
    this.router.navigate(['/tabs/recompensas']);
  }

 irAEscanear() {
    this.router.navigate(['/tabs/escanear']);
  }

  isNotifModalOpen = false;
  
  listaNotificaciones = [
    {
      titulo: '¡Bono de Bienvenida Activo!',
      mensaje: 'Felicidades, recibiste +250 puntos por unirte a Choayo Store.',
      tiempo: 'Hace 5 min',
      icono: 'gift-outline'
    },
    {
      titulo: 'Tu Cupón S/15 expira pronto',
      mensaje: 'Recuerda canjear tu cupón en caja antes de que venza su validez.',
      tiempo: 'Hace 2 horas',
      icono: 'alert-circle-outline'
    },
    {
      titulo: '¡Nueva Recompensa Disponible!',
      mensaje: 'Ya puedes canjear el combo de Descuento 20% con tus puntos.',
      tiempo: 'Ayer',
      icono: 'star' // <-- Cambiado de 'star-outline' a 'star'
    }
  ];

  // Al entrar a Home:
async verificarPerfil() {
  const user = await this.supabaseService.getUsuarioActual();
  if (!user) return;

  const perfil = await this.supabaseService.getPerfilUsuario(user.id);
  
  // Si no tiene perfil aún (primer login con Google):
  if (!perfil) {
    await this.supabaseService.insertar('usuarios', {
      id: user.id,
      nombre: user.user_metadata?.['full_name'] || 'Usuario Choayo',
      email: user.email,
      puntos_totales: 250, // Bono de bienvenida
      rol: 'cliente'
    });
  }
}

  abrirNotificaciones() {
    this.isNotifModalOpen = true;
  }
}