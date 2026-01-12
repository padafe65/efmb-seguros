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

  async enviarCorreo(to: string, mensaje: string) {
    await this.transporter.sendMail({
      from: '"Seguros MAB" <padafe654@gmail.com>',
      to,
      subject: 'Póliza próxima a vencer',
      text: mensaje,
    });
  }
}
