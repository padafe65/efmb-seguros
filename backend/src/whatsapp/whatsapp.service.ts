import { Injectable, Logger } from '@nestjs/common';
const twilio = require('twilio');

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly whatsappNumber = process.env.WHATSAPP_NUMBER || '573026603858';
  private readonly whatsappBaseUrl = 'https://wa.me';
  
  // Twilio configuration
  private readonly twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  private readonly twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  private readonly twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM; // formato: whatsapp:+14155238886
  private readonly useTwilio = process.env.USE_TWILIO === 'true' && 
                                this.twilioAccountSid && 
                                this.twilioAuthToken;
  
  private twilioClient: any = null;

  constructor() {
    // Inicializar cliente de Twilio si está configurado
    if (this.useTwilio) {
      try {
        this.twilioClient = twilio(this.twilioAccountSid, this.twilioAuthToken);
        this.logger.log('✅ Twilio WhatsApp configurado correctamente');
      } catch (error) {
        this.logger.warn('⚠️ Error inicializando Twilio, se usará modo enlaces directos', error);
      }
    } else {
      this.logger.log('ℹ️ Modo enlaces directos de WhatsApp (Twilio no configurado)');
    }
  }

  /**
   * Formatea número de teléfono a formato internacional
   */
  private formatearNumero(telefono: string): string {
    // Limpiar número: quitar espacios, guiones, paréntesis, +
    let numeroLimpio = telefono.replace(/[\s\-\(\)\+]/g, '');
    
    // Si no tiene código de país, agregar +57 para Colombia
    if (!numeroLimpio.startsWith('57')) {
      if (numeroLimpio.startsWith('0')) {
        numeroLimpio = '57' + numeroLimpio.substring(1);
      } else if (numeroLimpio.length <= 10) {
        numeroLimpio = '57' + numeroLimpio;
      }
    }
    
    return numeroLimpio;
  }

  /**
   * Envía mensaje por WhatsApp usando Twilio (si está configurado) o enlace directo
   */
  async enviar(telefono: string, mensaje: string) {
    try {
      const numeroFormateado = this.formatearNumero(telefono);
      
      // Intentar enviar con Twilio si está configurado
      if (this.useTwilio && this.twilioClient && this.twilioWhatsAppFrom) {
        try {
          const message = await this.twilioClient.messages.create({
            from: this.twilioWhatsAppFrom,
            to: `whatsapp:+${numeroFormateado}`,
            body: mensaje,
          });
          
          this.logger.log(`✅ WhatsApp enviado vía Twilio a ${telefono} (SID: ${message.sid})`);
          
          return {
            success: true,
            method: 'twilio',
            messageSid: message.sid,
            telefono: numeroFormateado,
            mensaje: mensaje,
          };
        } catch (twilioError: any) {
          this.logger.warn(`⚠️ Error enviando con Twilio, usando fallback: ${twilioError.message}`);
          // Continuar con fallback a enlace directo
        }
      }
      
      // Fallback: Generar enlace directo de WhatsApp
      const mensajeCodificado = encodeURIComponent(mensaje);
      const whatsappUrl = `${this.whatsappBaseUrl}/${numeroFormateado}?text=${mensajeCodificado}`;
      
      this.logger.log(`📲 WhatsApp URL generada para ${telefono}: ${whatsappUrl}`);
      
      return {
        success: true,
        method: 'direct_link',
        url: whatsappUrl,
        telefono: numeroFormateado,
        mensaje: mensaje,
      };
    } catch (error) {
      this.logger.error(`❌ Error enviando WhatsApp a ${telefono}`, error);
      throw error;
    }
  }

  /**
   * Obtiene el número de WhatsApp configurado para el negocio
   */
  getBusinessNumber(): string {
    return this.whatsappNumber;
  }

  /**
   * Genera URL para chat directo desde el frontend
   */
  generarUrlChat(mensajeInicial?: string): string {
    const mensaje = mensajeInicial || 'Hola, necesito información sobre seguros.';
    const mensajeCodificado = encodeURIComponent(mensaje);
    return `${this.whatsappBaseUrl}/${this.whatsappNumber}?text=${mensajeCodificado}`;
  }
}
