import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessageEntity } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { RespondMessageDto } from './dto/respond-message.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { AuditService } from 'src/audit/audit.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger('ContactService');

  constructor(
    @InjectRepository(ContactMessageEntity)
    private readonly contactMessageRepository: Repository<ContactMessageEntity>,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async createMessage(
    createDto: CreateContactMessageDto,
    userCompanyId?: number,
    userId?: number,
    clientIp?: string,
  ) {
    try {
      const finalUserId =
        userId || (createDto.user_id ? Number(createDto.user_id) : undefined);

      let finalCompanyId = userCompanyId;
      if (finalUserId && !finalCompanyId) {
        const user = await this.usersRepository.findOne({
          where: { id: finalUserId },
          relations: ['company'],
        });
        if (user?.company?.id) {
          finalCompanyId = user.company.id;
        }
      }

      const messageData: any = {
        nombre: createDto.nombre,
        email: createDto.email,
        asunto: createDto.asunto,
        mensaje: createDto.mensaje,
        user: finalUserId ? ({ id: finalUserId } as any) : undefined,
        leido: false,
        respondido: false,
      };

      if (finalCompanyId) {
        messageData.company = { id: finalCompanyId } as any;
      }

      const message = this.contactMessageRepository.create(messageData);
      const savedMessage = await this.contactMessageRepository.save(message);
      const savedEntity = Array.isArray(savedMessage)
        ? savedMessage[0]
        : savedMessage;

      await this.auditService.recordLog({
        userId: finalUserId || null,
        userEmail: savedEntity.email,
        action: 'CREATE',
        entity: 'ContactMessage',
        entityId: String(savedEntity.id),
        previousData: null,
        newData: savedEntity,
        ipAddress: clientIp,
      });

      const messageWithRelations = await this.contactMessageRepository.findOne({
        where: { id: savedEntity.id },
        relations: ['user', 'company'],
      });

      await this.sendNotificationEmail(messageWithRelations || savedEntity);

      this.logger.log(`Mensaje de contacto creado: ${savedEntity.id}`);

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
      let adminEmail = process.env.EMAIL_USER || 'padafe654@gmail.com';
      const companyId = message.company?.id;

      if (companyId) {
        const allUsers = await this.usersRepository.find({
          where: {
            company: { id: companyId },
            isactive: true,
          },
          relations: ['company'],
        });

        const adminUsers = allUsers.filter((user) => {
          const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
          return roles.includes('admin' as any);
        });

        if (adminUsers && adminUsers.length > 0) {
          adminEmail = adminUsers[0].email;
          const companyName = message.company?.nombre || 'N/A';
          this.logger.log(
            `Enviando email al admin de "\({companyName}" (ID:\){companyId}): ${adminEmail}`,
          );
        } else {
          this.logger.warn(
            `No se encontro admin activo para la compania \({companyId}, usando:\){adminEmail}`,
          );
        }
      } else {
        this.logger.log(
          `Mensaje sin company_id, usando email generico: ${adminEmail}`,
        );
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const userText = message.user
        ? `Usuario registrado: \({message.user.user_name} (ID:\){message.user.id})`
        : 'Usuario: No registrado (visitante)';

      const emailContent =
        String.fromCharCode(60) +
        'div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="background:#631025;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'h2' +
        String.fromCharCode(62) +
        'Nuevo Mensaje de Contacto' +
        String.fromCharCode(60) +
        '/h2' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        'Has recibido un nuevo mensaje desde el formulario de contacto:' +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="background:white;padding:20px;margin:20px 0;border-left:4px solid #3498db;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        'De: ' +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        message.nombre +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        'Email: ' +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        message.email +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        'Asunto: ' +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        message.asunto +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        'Mensaje:' +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p style="white-space:pre-wrap;"' +
        String.fromCharCode(62) +
        message.mensaje +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        'Fecha: ' +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        new Date(message.created_at).toLocaleString('es-ES') +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        userText +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p style="margin-top:30px;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'a href="' +
        frontendUrl +
        '/dashboard-admin" style="background:#3498db;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;"' +
        String.fromCharCode(62) +
        'Ver en Dashboard' +
        String.fromCharCode(60) +
        '/a' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="text-align:center;margin-top:20px;color:#666;font-size:12px;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        'EFMB Seguros - Sistema de Contacto' +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62);

      await this.notificationsService.enviarCorreo(
        adminEmail,
        `Nuevo mensaje de contacto: ${message.asunto}`,
        emailContent,
      );

      this.logger.log(`Email de notificacion enviado a: ${adminEmail}`);
    } catch (error) {
      this.logger.error('Error enviando email de notificacion', error);
    }
  }

  async findAll(
    requesterCompanyId?: number,
    requesterId?: number,
    requesterRoles?: string[],
  ) {
    const whereConditions: any = {};

    const isSubAdmin = requesterRoles?.includes('sub_admin');
    if (isSubAdmin && requesterId) {
      const messages = await this.contactMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.user', 'user')
        .leftJoinAndSelect('message.responded_by_user', 'responded_by_user')
        .leftJoinAndSelect('message.company', 'company')
        .where('user.created_by_id = :requesterId', { requesterId })
        .orderBy('message.created_at', 'DESC')
        .getMany();

      this.logger.log(
        `Filtrado para sub_admin (ID: ${requesterId}): solo mensajes de usuarios creados por el`,
      );
      return messages;
    }

    if (requesterCompanyId !== undefined && requesterCompanyId !== null) {
      whereConditions.company = { id: requesterCompanyId };
    }

    return await this.contactMessageRepository.find({
      where:
        Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      relations: ['user', 'responded_by_user', 'company'],
      order: { created_at: 'DESC' },
    });
  }

  async findByUserId(userId: number) {
    return await this.contactMessageRepository.find({
      where: { user: { id: userId } },
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

  async respondToMessage(
    id: number,
    respondDto: RespondMessageDto,
    respondedByUserId: number,
    currentUser?: any,
    clientIp?: string,
  ) {
    const message = await this.contactMessageRepository.findOne({
      where: { id },
      relations: ['user', 'responded_by_user', 'company'],
    });

    if (!message) {
      throw new NotFoundException(`Mensaje con ID ${id} no encontrado`);
    }

    const previousSnapshot = { ...message };

    message.respuesta = respondDto.respuesta;
    message.respondido = true;
    message.responded_at = new Date();
    message.responded_by_user = { id: respondedByUserId } as any;

    const savedMessage = await this.contactMessageRepository.save(message);

    await this.auditService.recordLog({
      userId: currentUser?.id || respondedByUserId || null,
      userEmail: currentUser?.email || 'Administrador',
      action: 'UPDATE',
      entity: 'ContactMessage',
      entityId: String(id),
      previousData: previousSnapshot,
      newData: savedMessage,
      ipAddress: clientIp,
    });

    await this.sendResponseEmail(savedMessage);

    this.logger.log(`Respuesta enviada al mensaje ${id}`);

    return savedMessage;
  }

  private async sendResponseEmail(message: ContactMessageEntity) {
    try {
      let companyName = 'Compañía de Seguros';
      if (message.company?.nombre) {
        companyName = message.company.nombre;
      } else if (message.company) {
        const companyId = (message.company as any).id;
        if (companyId) {
          const company = await this.companyRepository.findOne({
            where: { id: companyId },
          });
          if (company) {
            companyName = company.nombre || companyName;
          }
        }
      }

      const emailContent =
        String.fromCharCode(60) +
        'div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="background:#631025;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'h2' +
        String.fromCharCode(62) +
        'Respuesta a tu Consulta' +
        String.fromCharCode(60) +
        '/h2' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        'Hola ' +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        message.nombre +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        ',' +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        'Gracias por contactarnos. Hemos recibido tu mensaje sobre:' +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        '"' +
        message.asunto +
        '"' +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="background:white;padding:20px;margin:20px 0;border-left:4px solid #27ae60;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'h3' +
        String.fromCharCode(62) +
        'Nuestra Respuesta:' +
        String.fromCharCode(60) +
        '/h3' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p style="white-space:pre-wrap;"' +
        String.fromCharCode(62) +
        message.respuesta +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p style="margin-top:30px;"' +
        String.fromCharCode(62) +
        'Si tienes mas preguntas, no dudes en contactarnos nuevamente.' +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        'Atentamente,' +
        String.fromCharCode(60) +
        'br' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'strong' +
        String.fromCharCode(62) +
        'Equipo de ' +
        companyName +
        String.fromCharCode(60) +
        '/strong' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'div style="text-align:center;margin-top:20px;color:#666;font-size:12px;"' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        'p' +
        String.fromCharCode(62) +
        companyName +
        ' - Todos los derechos reservados' +
        String.fromCharCode(60) +
        '/p' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62) +
        String.fromCharCode(60) +
        '/div' +
        String.fromCharCode(62);

      await this.notificationsService.enviarCorreo(
        message.email,
        `Respuesta a tu consulta: ${message.asunto}`,
        emailContent,
      );

      this.logger.log(`Email de respuesta enviado a: ${message.email}`);
    } catch (error) {
      this.logger.error('Error enviando email de respuesta', error);
    }
  }

  async deleteMessage(id: number, currentUser?: any, clientIp?: string) {
    const message = await this.findOne(id);
    const previousSnapshot = { ...message };

    await this.contactMessageRepository.remove(message);

    await this.auditService.recordLog({
      userId: currentUser?.id || currentUser?.id_user || null,
      userEmail: currentUser?.email || 'Super Usuario',
      action: 'DELETE',
      entity: 'ContactMessage',
      entityId: String(id),
      previousData: previousSnapshot,
      newData: null,
      ipAddress: clientIp,
    });

    return { message: 'Mensaje eliminado correctamente' };
  }
}
