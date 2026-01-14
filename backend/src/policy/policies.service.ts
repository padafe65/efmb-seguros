// src/policy/policies.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { addMonths, startOfDay, endOfDay } from 'date-fns';
import { Between, ArrayContains } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PolicyEntity } from './entities/policy.entity';
import { Repository } from 'typeorm';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { addYears } from 'date-fns';
import { NotificationsService } from 'src/notifications/notifications.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';

@Injectable()
export class PoliciesService implements OnModuleInit {
  private readonly logger = new Logger('PoliciesService');

  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,
    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  // Ejecutar al iniciar la aplicación
  async onModuleInit() {
    this.logger.log('🚀 Módulo de políticas inicializado. Verificando pólizas por vencer...');
    // Esperar 5 segundos para que la base de datos esté lista
    setTimeout(() => {
      this.verificarPolizasPorVencer();
    }, 5000);
  }

  @Cron('0 8 * * *') // todos los días 8am
  async verificarPolizasPorVencer() {
    this.logger.log('🕐 Verificando pólizas por vencer');

    const hoy = startOfDay(new Date());
    // Buscar pólizas que vencen en menos de un mes (hoy hasta dentro de un mes)
    const enUnMes = endOfDay(addMonths(new Date(), 1));

    const polizas = await this.policyRepository.find({
      where: {
        fin_vigencia: Between(hoy, enUnMes),
        notificada: false,
      },
      relations: ['user', 'company'],
    });

    this.logger.log(`📄 Pólizas encontradas por vencer (menos de un mes): ${polizas.length}`);

    for (const poliza of polizas) {
      this.logger.log(`🔔 Avisando póliza ${poliza.policy_number}`);
      await this.enviarAvisos(poliza);
    }
  }

  async enviarAvisos(policy: PolicyEntity) {
    const fechaVencimiento = new Date(policy.fin_vigencia).toLocaleDateString('es-ES');
    const diasRestantes = Math.ceil((new Date(policy.fin_vigencia).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    const mensajeUsuario = `
Hola ${policy.user.user_name},
Tu póliza ${policy.policy_number} vence el ${fechaVencimiento} (en ${diasRestantes} días).
Comunícate con EFMB Seguros para renovarla.
`;

    const mensajeAdmin = `
ALERTA: Póliza próxima a vencer
Póliza: ${policy.policy_number}
Usuario: ${policy.user.user_name} (${policy.user.email})
Vence el: ${fechaVencimiento} (en ${diasRestantes} días)
Empresa: ${policy.company?.nombre || 'Sin empresa asignada'}
`;

    // 📧 Email usuario
    try {
      if (policy.user.email) {
        await this.notificationsService.enviarCorreo(
          policy.user.email,
          mensajeUsuario,
        );
        this.logger.log(`✅ Email enviado a usuario: ${policy.user.email}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error enviando email a usuario (${policy.user.email})`,
        error,
      );
    }

    // 🔍 Buscar admin de la empresa asociada (una sola vez para usar en email y WhatsApp)
    let adminEmail: string | null = null;
    let adminPhone: string | null = null;
    
    try {
      // Buscar admin de la empresa asociada a la póliza
      if (policy.company?.id) {
        // Buscar usuario admin de la compañía (roles es un array, usar ArrayContains)
        const admin = await this.userRepository.findOne({
          where: {
            company: { id: policy.company.id },
            roles: ArrayContains([ValidRoles.admin]),
            isactive: true,
          },
          relations: ['company'],
        });
        
        if (admin) {
          adminEmail = admin.email || null;
          adminPhone = admin.telefono || null;
          this.logger.log(`👤 Admin encontrado: ${admin.email || 'sin email'} (empresa: ${admin.company?.nombre || 'sin empresa'})`);
        } else {
          this.logger.log(`⚠️ No se encontró admin activo para la empresa ID: ${policy.company.id}`);
        }
      }
      
      // Si no hay admin encontrado, usar el email de la compañía como fallback
      if (!adminEmail && policy.company?.email) {
        adminEmail = policy.company.email;
        this.logger.log(`📧 Usando email de la compañía como fallback: ${adminEmail}`);
      }
      
      // Si todavía no hay email, usar el email genérico del admin
      if (!adminEmail && process.env.ADMIN_EMAIL) {
        adminEmail = process.env.ADMIN_EMAIL;
        this.logger.log(`📧 Usando email genérico del admin: ${adminEmail}`);
      }
      
      // Si no hay teléfono del admin, usar el teléfono de la compañía o el genérico
      if (!adminPhone) {
        if (policy.company?.telefono) {
          adminPhone = policy.company.telefono;
          this.logger.log(`📲 Usando teléfono de la compañía como fallback: ${adminPhone}`);
        } else if (process.env.ADMIN_PHONE) {
          adminPhone = process.env.ADMIN_PHONE;
          this.logger.log(`📲 Usando teléfono genérico del admin: ${adminPhone}`);
        }
      }
    } catch (error) {
      this.logger.error('❌ Error buscando admin de la empresa', error);
    }

    // 📧 Email admin de la empresa asociada
    try {
      if (adminEmail) {
        await this.notificationsService.enviarCorreo(
          adminEmail,
          mensajeAdmin,
        );
        this.logger.log(`✅ Email enviado al admin: ${adminEmail}`);
      } else {
        this.logger.warn(`⚠️ No se encontró email del admin para la póliza ${policy.policy_number}`);
      }
    } catch (error) {
      this.logger.error('❌ Error enviando email al admin', error);
    }

    // 📲 WhatsApp usuario (solo si está desplegado)
    try {
      if (policy.user.telefono && process.env.WHATSAPP_ENABLED === 'true') {
        await this.whatsappService.enviar(policy.user.telefono, mensajeUsuario);
        this.logger.log(`✅ WhatsApp enviado a usuario: ${policy.user.telefono}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error WhatsApp usuario (${policy.user.telefono})`,
        error,
      );
    }

    // 📲 WhatsApp admin (solo si está desplegado)
    try {
      if (adminPhone && process.env.WHATSAPP_ENABLED === 'true') {
        await this.whatsappService.enviar(adminPhone, mensajeAdmin);
        this.logger.log(`✅ WhatsApp enviado al admin: ${adminPhone}`);
      } else if (!adminPhone) {
        this.logger.warn(`⚠️ No se encontró teléfono del admin para WhatsApp (póliza ${policy.policy_number})`);
      }
    } catch (error) {
      this.logger.error('❌ Error WhatsApp admin', error);
    }

    // 🔐 Marcar como notificada SOLO si pasó por aquí
    policy.notificada = true;
    await this.policyRepository.save(policy);
    this.logger.log(`✅ Póliza ${policy.policy_number} marcada como notificada`);
  }

  async create(dto: CreatePolicyDto, creatorCompanyId?: number, creatorId?: number, creatorRole?: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: +dto.user_id },
        relations: ['company'],
      });
      if (!user)
        throw new NotFoundException(`User with id ${dto.user_id} not found`);

      const { user_id, inicio_vigencia, ...rest } = dto;

      const inicio = new Date(inicio_vigencia);
      const fin = addYears(inicio, 1); // 🔥 1 año automático

      // Determinar company_id: usar el del creador o el del usuario
      const companyId = creatorCompanyId || user.company?.id;
      
      const policyData: any = {
        ...rest,
        inicio_vigencia: inicio,
        fin_vigencia: fin,
        user,
      };

      // Solo asignar company si existe (después de ejecutar script SQL será obligatorio)
      if (companyId) {
        policyData.company = { id: companyId } as any;
      }

      // Guardar información del creador (admin o sub_admin)
      if (creatorId && creatorRole) {
        policyData.created_by_id = creatorId;
        policyData.created_by_role = creatorRole;
        this.logger.log(`📝 Póliza creada por ${creatorRole} (ID: ${creatorId})`);
      }

      const policy = this.policyRepository.create(policyData);

      const saved = await this.policyRepository.save(policy);
      return {
        message: 'Policy created!',
        policy: saved,
      };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async findAllWithFilters(
    params: {
      userId?: string;
      policyNumber?: string;
      placa?: string;
      limit?: number;
      skip?: number;
      company_id?: number; // Para filtrar por empresa
    }, 
    requesterCompanyId?: number,
    requesterId?: number,
    requesterRoles?: string[]
  ) {
    try {
      const { userId, policyNumber, placa, limit, skip, company_id } = params;

      const query = this.policyRepository
        .createQueryBuilder('policy')
        .leftJoinAndSelect('policy.user', 'user')
        .leftJoinAndSelect('policy.company', 'company')
        .skip(skip || 0)
        .take(limit || 100);

      // 🔒 FILTRADO ESPECIAL PARA sub_admin: solo puede ver las pólizas que él creó
      const isSubAdmin = requesterRoles?.includes(ValidRoles.sub_admin);
      if (isSubAdmin && requesterId) {
        // Solo mostrar pólizas donde created_by_id sea igual al ID del sub_admin
        // Si created_by_id es null, no se mostrará (pólizas antiguas sin creador)
        query.andWhere('policy.created_by_id = :creatorId', { creatorId: requesterId });
        this.logger.log(`🔒 Filtrado para sub_admin (ID: ${requesterId}, Roles: ${requesterRoles?.join(', ')}): solo pólizas creadas por él`);
      } else if (isSubAdmin && !requesterId) {
        this.logger.warn(`⚠️ sub_admin sin requesterId - no se puede aplicar filtro de created_by_id`);
      }

      if (userId) {
        query.andWhere('user.id = :uid', { uid: Number(userId) });
      }

      if (policyNumber) {
        query.andWhere('policy.policy_number ILIKE :pn', {
          pn: `%${policyNumber}%`,
        });
      }

      if (placa) {
        query.andWhere('policy.placa ILIKE :pl', { pl: `%${placa}%` });
      }

      // Filtrar por company_id
      // Si se proporciona company_id explícitamente (super_user), usarlo
      // Si no, usar el company_id del requester (admin solo ve su empresa)
      const filterCompanyId = company_id !== undefined 
        ? company_id 
        : (requesterCompanyId !== undefined && requesterCompanyId !== null ? requesterCompanyId : undefined);

      if (filterCompanyId !== undefined) {
        query.andWhere('company.id = :cid', { cid: filterCompanyId });
      }

      const policies = await query.getMany();
      
      // Log para debugging - verificar que user_name esté presente
      if (policies.length > 0) {
        this.logger.debug(`📋 Pólizas encontradas: ${policies.length}`);
        this.logger.debug(`👤 Ejemplo de usuario en póliza: ${JSON.stringify({
          id: policies[0].user?.id,
          user_name: policies[0].user?.user_name,
          email: policies[0].user?.email
        })}`);
      }
      
      return policies;
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async findOne(id_policy: number, requesterId?: number) {
    // Usar query builder para asegurar que company_id esté disponible
    const policy = await this.policyRepository
      .createQueryBuilder('policy')
      .leftJoinAndSelect('policy.user', 'user')
      .leftJoinAndSelect('policy.company', 'company')
      .where('policy.id_policy = :id_policy', { id_policy })
      .getOne();

    if (!policy)
      throw new NotFoundException(`Policy with id ${id_policy} not found`);

    // Si se proporciona requesterId, verificar que sea el creador (para sub_admin)
    if (requesterId !== undefined && policy.created_by_id !== requesterId) {
      this.logger.warn(`⚠️ Intento de acceso a póliza ${id_policy} por usuario ${requesterId} que no es el creador`);
      throw new ForbiddenException('No tienes permisos para ver esta póliza. Solo puedes ver las pólizas que creaste.');
    }

    // Obtener información del creador si existe
    let creatorInfo: { id: number; user_name: string; email: string } | null = null;
    if (policy.created_by_id) {
      const creator = await this.userRepository.findOne({
        where: { id: policy.created_by_id },
        select: ['id', 'user_name', 'email'],
      });
      if (creator) {
        creatorInfo = {
          id: creator.id,
          user_name: creator.user_name,
          email: creator.email,
        };
      }
    }

    // Obtener company_id explícitamente
    const companyId = policy.company?.id || null;
    
    // Retornar la póliza con información adicional
    return {
      ...policy,
      company_id: companyId, // Asegurar que company_id esté presente
      creator: creatorInfo,
    };
  }

  async findByUser(userId: number, userCompanyId?: number) {
    const whereConditions: any = {
      user: { id: userId },
    };

    // Si el usuario tiene company_id, filtrar por él
    if (userCompanyId !== undefined && userCompanyId !== null) {
      whereConditions.company = { id: userCompanyId };
    }

    return await this.policyRepository.find({
      where: whereConditions,
      relations: ['user', 'company'],
    });
  }

  async update(id_policy: number, dto: UpdatePolicyDto, requesterId?: number) {
    console.log('DTO RECIBIDO EN UPDATE:', dto);
    try {
      const { user_id, fin_vigencia, created_by_id, created_by_role, company_id, notificada, ...rest } = dto as any;

      // Si se proporciona requesterId, es un sub_admin y no puede modificar estos campos
      // Si NO se proporciona requesterId, es admin o super_user y puede modificar todo

      if (fin_vigencia) {
        rest.fin_vigencia = new Date(fin_vigencia);
      }

      // 🔥 preload usando id_policy
      const policy = await this.policyRepository.preload({
        id_policy,
        ...rest,
      });

      if (!policy)
        throw new NotFoundException(`Policy with id ${id_policy} not found`);

      // Si se proporciona requesterId, verificar que sea el creador (para sub_admin)
      if (requesterId !== undefined && policy.created_by_id !== requesterId) {
        this.logger.warn(`⚠️ Intento de editar póliza ${id_policy} por usuario ${requesterId} que no es el creador`);
        throw new ForbiddenException('No tienes permisos para editar esta póliza. Solo puedes editar las pólizas que creaste.');
      }

      if (user_id) {
        const user = await this.userRepository.findOneBy({ id: +user_id });
        if (!user)
          throw new NotFoundException(`User with id ${user_id} not found`);
        policy.user = user;
      }

      // Actualizar company_id si se proporciona (solo admin y super_user pueden hacer esto)
      if (company_id !== undefined && requesterId === undefined) {
        const company = await this.companyRepository.findOneBy({ id: +company_id });
        if (!company)
          throw new NotFoundException(`Company with id ${company_id} not found`);
        policy.company = company;
      }

      // Actualizar created_by_id y created_by_role si se proporcionan (solo admin y super_user)
      if (requesterId === undefined) {
        if (created_by_id !== undefined) {
          const creator = await this.userRepository.findOneBy({ id: +created_by_id });
          if (!creator)
            throw new NotFoundException(`Creator user with id ${created_by_id} not found`);
          policy.created_by_id = +created_by_id;
        }
        
        if (created_by_role !== undefined) {
          policy.created_by_role = created_by_role;
        }
        
        // Actualizar notificada si se proporciona
        if (notificada !== undefined) {
          policy.notificada = notificada === true || notificada === "true";
        }
      }

      const saved = await this.policyRepository.save(policy);
      return { message: 'Policy updated!', policy: saved };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async remove(id_policy: number, requesterId?: number) {
    try {
      const policy = await this.policyRepository.findOne({
        where: { id_policy },
      });

      if (!policy)
        throw new NotFoundException(`Policy with id ${id_policy} not found`);

      // Si se proporciona requesterId, verificar que sea el creador (para sub_admin)
      if (requesterId !== undefined && policy.created_by_id !== requesterId) {
        this.logger.warn(`⚠️ Intento de eliminar póliza ${id_policy} por usuario ${requesterId} que no es el creador`);
        throw new ForbiddenException('No tienes permisos para eliminar esta póliza. Solo puedes eliminar las pólizas que creaste.');
      }

      await this.policyRepository.delete({ id_policy });
      return `Policy with id ${id_policy} was deleted`;
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  private handlerErrors(error: any) {
    this.logger.error(error);
    throw new BadRequestException(error?.message || 'Unexpected error');
  }
}
