import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon,
  IonButton,
  IonModal,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  scanOutline,
  flashOutline,
  flash,
  closeOutline,
  checkmarkCircleOutline,
  qrCodeOutline,
  bulbOutline,
  keypadOutline,
  receiptOutline,
  barcodeOutline
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
    RouterModule,
    FormsModule
  ]
})
export class ScanPage implements OnDestroy {

  isModalOpen = false;
  isManualModalOpen = false;
  codigoManual = '';
  puntosGanados = 0;
  isScanning = false;
  isFlashOn = false;

  private qrScanner: Html5Qrcode | null = null;
  private isProcessing = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({
      scanOutline,
      flashOutline,
      flash,
      closeOutline,
      checkmarkCircleOutline,
      qrCodeOutline,
      bulbOutline,
      keypadOutline,
      receiptOutline,
      barcodeOutline
    });
  }

  ionViewDidEnter() {
    this.iniciarCamara();
  }

  ionViewWillLeave() {
    this.detenerCamara();
  }

  ngOnDestroy() {
    this.detenerCamara();
  }

  async iniciarCamara() {
    if (this.isScanning) return;

    try {
      if (!this.qrScanner) {
        this.qrScanner = new Html5Qrcode('qr-reader');
      }

      const config = {
        fps: 15,
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      };

      await this.qrScanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => this.onQrDetectado(decodedText),
        () => {}
      );

      this.isScanning = true;
      this.isProcessing = false;
    } catch (error) {
      console.warn('Cámara no disponible:', error);
      this.isScanning = false;
    }
  }

  async onQrDetectado(decodedText: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    await this.detenerCamara();

    let ticketId = '';
    let puntos = 150;

    try {
      const data = JSON.parse(decodedText);
      ticketId = data.ticket_id || '';
      puntos = data.monto ? Math.floor(data.monto) : 150;
    } catch {
      ticketId = decodedText.trim();
    }

    if (!ticketId) {
      await this.mostrarAlerta('QR Inválido', 'El formato del comprobante no es válido.');
      this.isProcessing = false;
      this.iniciarCamara();
      return;
    }

    await this.procesarTransaccion(ticketId, puntos);
  }

  // Control del modal manual
  abrirModalManual() {
    this.codigoManual = '';
    this.isManualModalOpen = true;
  }

  cerrarModalManual() {
    this.isManualModalOpen = false;
  }

  async canjearCodigoManual() {
    const ticketLimpio = this.codigoManual.trim();
    if (!ticketLimpio) return;

    this.cerrarModalManual();
    await this.detenerCamara();
    await this.procesarTransaccion(ticketLimpio, 150);
  }

  // Transacción segura en Supabase
  private async procesarTransaccion(ticketId: string, puntos: number) {
    try {
      const userAuth = await this.supabaseService.getUsuarioActual();
      if (!userAuth) return;

      const perfil = await this.supabaseService.getPerfilUsuario(userAuth.id);
      if (!perfil) return;

      // Inserción con UNIQUE constraint en ticket_id
      await this.supabaseService.insertar('historico_puntos', {
        usuario_id: userAuth.id,
        tipo: 'ganado',
        puntos: puntos,
        descripcion: `Compra boleta: ${ticketId}`,
        ticket_id: ticketId
      });

      // Sumar al total
      const nuevosPuntos = (perfil.puntos_totales || 0) + puntos;
      await this.supabaseService.actualizar('usuarios', userAuth.id, {
        puntos_totales: nuevosPuntos
      });

      this.puntosGanados = puntos;
      this.isModalOpen = true;

    } catch (error: any) {
      console.error('Error al registrar puntos:', error);

      if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
        await this.mostrarAlerta(
          'Código ya canjeado',
          `La boleta "${ticketId}" ya fue registrada previamente.`
        );
      } else {
        await this.mostrarAlerta(
          'Error de canje',
          'No se pudo validar el código. Verifica e intenta nuevamente.'
        );
      }

      this.isProcessing = false;
      this.iniciarCamara();
    }
  }

  simularEscaneo() {
    const idPrueba = 'BOL-SIM-' + Math.floor(1000 + Math.random() * 9000);
    const puntosPrueba = Math.floor(Math.random() * (400 - 100 + 1) + 100);
    this.procesarTransaccion(idPrueba, puntosPrueba);
  }

  async toggleFlash() {
    if (!this.isScanning || !this.qrScanner) return;
    try {
      this.isFlashOn = !this.isFlashOn;
      await this.qrScanner.applyVideoConstraints({
        advanced: [{ torch: this.isFlashOn } as any]
      });
    } catch {
      console.log('Flash no disponible');
    }
  }

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

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['Entendido']
    });
    await alert.present();
  }

  cerrarYVolver() {
    this.detenerCamara();
    this.isModalOpen = false;
    this.isManualModalOpen = false;
    setTimeout(() => {
      this.router.navigate(['/tabs/home']);
    }, 200);
  }
}