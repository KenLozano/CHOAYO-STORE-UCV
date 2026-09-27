import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonButton, IonModal } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  scanOutline,
  flashOutline,
  flash,
  closeOutline,
  checkmarkCircleOutline,
  qrCodeOutline,
  bulbOutline
} from 'ionicons/icons';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { SupabaseService } from '../../services/supabase.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonButton,
    IonModal,
    CommonModule,
    RouterModule
  ]
})
export class ScanPage implements OnDestroy {

  isModalOpen = false;
  puntosGanados = 0;
  isScanning = false;
  isFlashOn = false;

  private qrScanner: Html5Qrcode | null = null;
  private isProcessing = false; // Candado para evitar múltiples lecturas seguidas

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    addIcons({
      scanOutline,
      flashOutline,
      flash,
      closeOutline,
      checkmarkCircleOutline,
      qrCodeOutline,
      bulbOutline
    });
  }

  // Ciclos de vida Ionic: Encender y apagar cámara según navegación
  ionViewDidEnter() {
    this.iniciarCamara();
  }

  ionViewWillLeave() {
    this.detenerCamara();
  }

  ngOnDestroy() {
    this.detenerCamara();
  }

  // Inicialización de la cámara con html5-qrcode
  async iniciarCamara() {
    if (this.isScanning) return;

    try {
      if (!this.qrScanner) {
        this.qrScanner = new Html5Qrcode('qr-reader');
      }

      const config = {
  fps: 15,
  formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
  aspectRatio: 1.0,
  // Sin 'qrbox' para que el video llene el cuadro completo sin franjas negras
};
      

      await this.qrScanner.start(
        { facingMode: 'environment' }, // Usa cámara trasera en móviles
        config,
        (decodedText) => this.onQrDetectado(decodedText),
        () => {} // Ignorar cuadros sin QR detectado
      );

      this.isScanning = true;
      this.isProcessing = false;
    } catch (error) {
      console.warn('No se pudo acceder a la cámara trasera o entorno sin cámara:', error);
      this.isScanning = false;
    }
  }

  // Handler al detectar un código QR real
  async onQrDetectado(decodedText: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    await this.detenerCamara();

    // Interpretar si el QR viene en formato JSON { monto: 150, ticket_id: "..." } o número plano
    let puntos = 140;
    let descripcion = 'Escaneo de código QR en tienda';

    try {
      const data = JSON.parse(decodedText);
      if (data.monto) puntos = Math.floor(data.monto);
      if (data.ticket_id) descripcion = `Compra boleta: ${data.ticket_id}`;
    } catch {
      // Si el QR tiene un número simple o texto
      const parsedNum = parseInt(decodedText, 10);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        puntos = parsedNum;
      }
    }

    await this.acreditarPuntos(puntos, descripcion);
  }

  // Transacción unificada hacia Supabase
  private async acreditarPuntos(puntos: number, descripcion: string) {
    this.puntosGanados = puntos;

    try {
      const userAuth = await this.supabaseService.getUsuarioActual();
      if (!userAuth) return;

      const perfil = await this.supabaseService.getPerfilUsuario(userAuth.id);
      if (!perfil) return;

      const nuevosPuntos = (perfil.puntos_totales || 0) + this.puntosGanados;

      await this.supabaseService.actualizar('usuarios', userAuth.id, {
        puntos_totales: nuevosPuntos
      });

      await this.supabaseService.insertar('historico_puntos', {
        usuario_id: userAuth.id,
        tipo: 'ganado',
        puntos: this.puntosGanados,
        descripcion: descripcion
      });

      this.isModalOpen = true;

    } catch (error) {
      console.error('Error al registrar puntos en Supabase:', error);
      this.isProcessing = false;
    }
  }

  // Simulación manual (utiliza el mismo método centralizado)
  simularEscaneo() {
    const randomPts = Math.floor(Math.random() * (500 - 100 + 1) + 100);
    this.acreditarPuntos(randomPts, 'Simulación de escaneo de compra');
  }

  // Linterna / Flash
  async toggleFlash() {
    if (!this.isScanning || !this.qrScanner) return;

    try {
      this.isFlashOn = !this.isFlashOn;
      await this.qrScanner.applyVideoConstraints({
        advanced: [{ torch: this.isFlashOn } as any]
      });
    } catch (e) {
      console.log('Linterna no soportada en este dispositivo.');
    }
  }

  // Detención segura del sensor de video
  async detenerCamara() {
    if (this.qrScanner && this.qrScanner.isScanning) {
      try {
        await this.qrScanner.stop();
      } catch (err) {
        console.warn('Error al detener scanner:', err);
      } finally {
        this.isScanning = false;
      }
    }
  }

  cerrarYVolver() {
    this.detenerCamara();
    this.isModalOpen = false;

    setTimeout(() => {
      this.router.navigate(['/tabs/home']);
    }, 200);
  }
}