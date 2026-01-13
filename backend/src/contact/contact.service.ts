import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessageEntity } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { RespondMessageDto } from './dto/respond-message.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ContactService {
  private readonly logger = new Logger('ContactService');

  constructor(
    @InjectRepository(ContactMessageEntity)
    private readonly contactMessageRepository: Repository<ContactMessageEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMessage(createDto: CreateContactMessageDto, userCompanyId?: number) {
    try {
      const messageData: any = {
        nombre: createDto.nombre,
        email: createDto.email,
        asunto: createDto.asunto,
        mensaje: createDto.mensaje,
        user: createDto.user_id ? { id: createDto.user_id } as any : undefined,
        leido: false,
        respondido: false,
      };

      // Asignar company_id si el usuario está logueado
      if (userCompanyId) {
        messageData.company = { id: userCompanyId } as any;
      } else if (createDto.user_id) {
        // Si hay user_id, obtener su company_id
        // Esto se puede hacer mejor con una relación, pero por ahora así
      }

      const message = this.contactMessageRepository.create(messageData);
      const savedMessage = await this.contactMessageRepository.save(message);
      
      // Asegurar que es un objeto único, no un array
      const savedEntity = Array.isArray(savedMessage) ? savedMessage[0] : savedMessage;

      // Enviar email al administrador
      await this.sendNotificationEmail(savedEntity);

      this.logger.log(`✅ Mensaje de contacto creado: ${savedEntity.id}`);

      return {
        message: 'Mensaje enviado correctamente',
        id: savedEntity.id,
      };
    } catch (error) {
      this.logger.error('Error creando mensaje de contacto', error);
      throw error;
    }
  }

  private async sendNotificationEmail(message: ContactMessageEntity) {
    try {
      const adminEmail = process.env.EMAIL_USER || 'padafe654@gmail.com';
      
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #631025, #4c55d3); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #3498db; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Nuevo Mensaje de Contacto</h2>
            </div>
            <div class="content">
              <p>Has recibido un nuevo mensaje desde el formulario de contacto:</p>
              
              <div class="message-box">
                <p><strong>De:</strong> ${message.nombre}</p>
                <p><strong>Email:</strong> ${message.email}</p>
                <p><strong>Asunto:</strong> ${message.asunto}</p>
                <p><strong>Mensaje:</strong></p>
                <p style="white-space: pre-wrap;">${message.mensaje}</p>
              </div>

              <p><strong>Fecha:</strong> ${new Date(message.created_at).toLocaleString('es-ES')}</p>
              ${message.user ? `<p><strong>Usuario registrado:</strong> ${message.user.user_name} (ID: ${message.user.id})</p>` : '<p><strong>Usuario:</strong> No registrado (visitante)</p>'}
              
              <p style="margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard-admin" 
                   style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Ver en Dashboard
                </a>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 Seguros MAB - Sistema de Contacto</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.notificationsService.enviarCorreo(
        adminEmail,
        `Nuevo mensaje de contacto: ${message.asunto}`,
        emailContent,
      );

      this.logger.log(`✅ Email de notificación enviado a: ${adminEmail}`);
    } catch (error) {
      this.logger.error('Error enviando email de notificación', error);
      // No lanzar error para que el mensaje se guarde aunque falle el email
    }
  }

  async findAll(requesterCompanyId?: number) {
    const whereConditions: any = {};

    // Si el requester es admin, solo ver mensajes de su empresa
    if (requesterCompanyId !== undefined && requesterCompanyId !== null) {
      whereConditions.company = { id: requesterCompanyId };
    }

    return await this.contactMessageRepository.find({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      relations: ['user', 'responded_by_user', 'company'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const message = await this.contactMessageRepository.findOne({
      where: { id },
      relations: ['user', 'responded_by_user'],
    });

    if (!message) {
      throw new NotFoundException(`Mensaje con ID ${id} no encontrado`);
    }

    return message;
  }

  async markAsRead(id: number) {
    const message = await this.findOne(id);
    message.leido = true;
    return await this.contactMessageRepository.save(message);
  }

  async respondToMessage(id: number, respondDto: RespondMessageDto, respondedByUserId: number) {
    const message = await this.findOne(id);

    message.respuesta = respondDto.respuesta;
    message.respondido = true;
    message.responded_at = new Date();
    message.responded_by_user = { id: respondedByUserId } as any;

    const savedMessage = await this.contactMessageRepository.save(message);

    // Enviar email de respuesta al usuario
    await this.sendResponseEmail(savedMessage);

    this.logger.log(`✅ Respuesta enviada al mensaje ${id}`);

    return savedMessage;
  }

  private async sendResponseEmail(message: ContactMessageEntity) {
    try {
      const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #631025, #4c55d3); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .response-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #27ae60; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Respuesta a tu Consulta</h2>
            </div>
            <div class="content">
              <p>Hola <strong>${message.nombre}</strong>,</p>
              
              <p>Gracias por contactarnos. Hemos recibido tu mensaje sobre:</p>
              <p><strong>"${message.asunto}"</strong></p>
              
              <div class="response-box">
                <h3>Nuestra Respuesta:</h3>
                <p style="white-space: pre-wrap;">${message.respuesta}</p>
              </div>

              <p style="margin-top: 30px;">
                Si tienes más preguntas, no dudes en contactarnos nuevamente.
              </p>

              <p>Atentamente,<br><strong>Equipo de Seguros MAB</strong></p>
            </div>
            <div class="footer">
              <p>© 2026 Seguros MAB - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await this.notificationsService.enviarCorreo(
        message.email,
        `Respuesta a tu consulta: ${message.asunto}`,
        emailContent,
      );

      this.logger.log(`✅ Email de respuesta enviado a: ${message.email}`);
    } catch (error) {
      this.logger.error('Error enviando email de respuesta', error);
    }
  }

  async deleteMessage(id: number) {
    const message = await this.findOne(id);
    await this.contactMessageRepository.remove(message);
    return { message: 'Mensaje eliminado correctamente' };
  }
}
