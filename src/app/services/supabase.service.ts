import { Injectable } from '@angular/core';
import { supabase } from '../../environments/supabase.config';

/**
 * SERVICIO SUPABASE - GUÍA RÁPIDA PARA EL EQUIPO
 *
 * Tablas disponibles: usuarios, comercios, recompensas, puntos, historico_puntos, canjes
 *
 * Ejemplos de uso:
 * - this.supabaseService.getAll('usuarios')
 * - this.supabaseService.insertar('canjes', { usuario_id, recompensa_id, estado: 'pendiente' })
 * - this.supabaseService.actualizar('recompensas', id, { existencias: 49 })
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  // Obtener todas las recompensas activas
  async getRecompensas() {
    const { data, error } = await supabase
      .from('recompensas')
      .select('*')
      .eq('activa', true);
    if (error) {
      console.error('Error al obtener recompensas:', error);
      return [];
    }
    return data;
  }

  // Obtener todos los registros de una tabla
  async getAll(tabla: string) {
    const { data, error } = await supabase.from(tabla).select('*');
    if (error) {
      console.error(`Error al obtener ${tabla}:`, error);
      return [];
    }
    return data;
  }

  // Insertar un registro
  async insertar(tabla: string, valores: any) {
    const { data, error } = await supabase.from(tabla).insert(valores).select();
    if (error) {
      console.error(`Error al insertar en ${tabla}:`, error);
      return null;
    }
    return data;
  }

  // Actualizar un registro por su id
  async actualizar(tabla: string, id: string, valores: any) {
    const { data, error } = await supabase
      .from(tabla)
      .update(valores)
      .eq('identificacion', id)
      .select();
    if (error) {
      console.error(`Error al actualizar ${tabla}:`, error);
      return null;
    }
    return data;
  }

  // ─── AUTENTICACIÓN ───────────────────────────────────────

  // Registrar nuevo usuario
  async registrar(email: string, password: string, nombre: string, telefono: string = '') {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre }
      }
    });

    if (error) {
      console.error('Error al registrar:', error);
      return null;
    }

    if (data.user) {
      await this.insertar('usuarios', {
        identificacion: data.user.id,
        nombre: nombre,
        correo_electronico: email,
        telefono: telefono,
        puntos_totales: 250
      });

      await this.insertar('historico_puntos', {
        usuario_id: data.user.id,
        tipo: 'ganado',
        puntos: 250,
        descripcion: 'Bono de bienvenida'
      });
    }

    return data;
  }

  // Iniciar sesión
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error al iniciar sesión:', error);
      return null;
    }

    return data;
  }

  // En tu SupabaseService
async loginConGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Redirige al home de la app tras iniciar sesión
      redirectTo: `${window.location.origin}/tabs/home`,
    },
  });

  if (error) {
    console.error('Error al iniciar sesión con Google:', error.message);
    throw error;
  }

  return data;
}

  // Cerrar sesión
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error al cerrar sesión:', error);
  }

  // Obtener usuario logueado actualmente
  async getUsuarioActual() {
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  }

  // Obtener perfil completo desde la tabla usuarios
  async getPerfilUsuario(userId: string) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('identificacion', userId)
      .single();

    if (error) {
      console.error('Error al obtener perfil:', error);
      return null;
    }
    return data;
  }

  // Sesión activa (para persistencia)
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  }

  // Actualizar contraseña del usuario activo
  async actualizarPassword(nuevaPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: nuevaPassword
    });
    if (error) {
      console.error('Error al actualizar contraseña:', error);
      return { error };
    }
    return { data };
  }

  // Enviar correo electrónico para restablecer la contraseña
  async recuperarContrasena(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/restablecer-password',
    });
    if (error) {
      console.error('Error al solicitar recuperación:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  }

}