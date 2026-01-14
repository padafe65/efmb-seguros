import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async enviarCorreo(to: string, mensaje: string, html?: string) {
    await this.transporter.sendMail({
      from: '"EFMB Seguros" <padafe654@gmail.com>',
      to,
      subject: 'Póliza próxima a vencer',
      text: mensaje,
      html: html || mensaje,
    });
  }

  async enviarEmailRestablecimiento(to: string, resetLink: string, userName: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #631025, #4c55d3); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0984e3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>EFMB Seguros</h2>
          </div>
          <div class="content">
            <h3>Restablecer Contraseña</h3>
            <p>Hola ${userName},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #0984e3;">${resetLink}</p>
            <p><strong>Este enlace expirará en 1 hora.</strong></p>
            <p>Si no solicitaste este cambio, ignora este correo y tu contraseña permanecerá sin cambios.</p>
          </div>
          <div class="footer">
            <p>© 2026 EFMB Seguros - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: '"EFMB Seguros" <padafe654@gmail.com>',
      to,
      subject: 'Restablecer Contraseña - EFMB Seguros',
      html: htmlContent,
      text: `Hola ${userName},\n\nHas solicitado restablecer tu contraseña. Visita este enlace para crear una nueva contraseña:\n\n${resetLink}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste este cambio, ignora este correo.`,
    });
  }
}
