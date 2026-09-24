// src/policy/policies.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { addMonths, startOfDay, endOfDay, addYears } from 'date-fns';
import { Between, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PolicyEntity } from './entities/policy.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger('PoliciesService');

  constructor(
    @InjectRepository(PolicyEntity)
    private readonly policyRepository: Repository<PolicyEntity>,

    @InjectRepository(UsersEntity)
    private readonly userRepository: Repository<UsersEntity>,

    private readonly notificationsService: NotificationsService,

    private readonly whatsappService: WhatsappService,

    private readonly auditService: AuditService, // Inyección de auditoría
  ) {}

  @Cron('0 8 * * *') // todos los días 8am
  async verificarPolizasPorVencer() {
    this.logger.log('🕐 Verificando pólizas por vencer');

    const hoy = startOfDay(new Date());
    const enUnMes = endOfDay(addMonths(new Date(), 1));

    const polizas = await this.policyRepository.find({
      where: {
        fin_vigencia: Between(hoy, enUnMes),
        notificada: false,
      },
      relations: ['user'],
    });

    this.logger.log(`📄 Pólizas encontradas: ${polizas.length}`);

    for (const poliza of polizas) {
      this.logger.log(`🔔 Avisando póliza ${poliza.policy_number}`);
      await this.enviarAvisos(poliza);
    }
  }

  async enviarAvisos(policy: PolicyEntity) {
    const mensaje = `
Hola ${policy.user.user_name},
Tu póliza ${policy.policy_number} vence el ${policy.fin_vigencia}.
Comunícate con Seguros MAB para renovarla.
`;

    // 📧 Email usuario
    try {
      if (policy.user.email) {
        await this.notificationsService.enviarCorreo(
          policy.user.email,
          mensaje,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error enviando email a usuario (${policy.user.email})`,
        error,
      );
    }

    // 📧 Email admin
    try {
      if (process.env.ADMIN_EMAIL) {
        await this.notificationsService.enviarCorreo(
          process.env.ADMIN_EMAIL,
          mensaje,
        );
      }
    } catch (error) {
      this.logger.error('❌ Error enviando email al admin', error);
    }

    // 📲 WhatsApp usuario
    try {
      if (policy.user.telefono) {
        await this.whatsappService.enviar(policy.user.telefono, mensaje);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error WhatsApp usuario (${policy.user.telefono})`,
        error,
      );
    }

    // 📲 WhatsApp admin
    try {
      if (process.env.ADMIN_PHONE) {
        await this.whatsappService.enviar(process.env.ADMIN_PHONE, mensaje);
      }
    } catch (error) {
      this.logger.error('❌ Error WhatsApp admin', error);
    }

    // 🔐 Marcar como notificada SOLO si pasó por aquí
    policy.notificada = true;
    await this.policyRepository.save(policy);
  }

  async create(
    dto: CreatePolicyDto,
    creatorCompanyId?: number,
    currentUser?: any,
    clientIp?: string,
  ) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: +dto.user_id },
        relations: ['company'],
      });
      if (!user)
        throw new NotFoundException(`User with id ${dto.user_id} not found`);

      const { user_id, inicio_vigencia, ...rest } = dto;

      const inicio = new Date(inicio_vigencia);
      const fin = addYears(inicio, 1);

      const companyId = creatorCompanyId || user.company?.id;

      const policyData: any = {
        ...rest,
        inicio_vigencia: inicio,
        fin_vigencia: fin,
        user,
      };

      if (companyId) {
        policyData.company = { id: companyId } as any;
      }

      const policy = this.policyRepository.create(policyData);
      const saved: any = await this.policyRepository.save(policy);

      const createdSnapshot = {
        policy_number: saved.policy_number,
        tipo_poliza: saved.tipo_poliza,
        tipo_riesgo: saved.tipo_riesgo,
        placa: saved.placa,
        valor_asegurado: saved.valor_asegurado,
        valor_comercial: saved.valor_comercial,
        valor_accesorios: saved.valor_accesorios,
        valor_total_comercial: saved.valor_total_comercial,
        inicio_vigencia: saved.inicio_vigencia,
        fin_vigencia: saved.fin_vigencia,
        user_id: user.id,
        company_id: companyId || null,
      };

      // 📝 Auditoría: Creación
      await this.auditService.recordLog({
        userId: currentUser?.id || currentUser?.id_user || null,
        userEmail:
          currentUser?.email || currentUser?.user_name || 'Super Usuario',
        action: 'CREATE',
        entity: 'Policy',
        entityId: String(saved.id_policy),
        previousData: null,
        newData: createdSnapshot,
        ipAddress: clientIp || null, // 👈 Se asigna la IP
      });

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
      company_id?: number;
    },
    requesterCompanyId?: number,
  ) {
    try {
      const { userId, policyNumber, placa, limit, skip, company_id } = params;

      const query = this.policyRepository
        .createQueryBuilder('policy')
        .leftJoinAndSelect('policy.user', 'user')
        .leftJoinAndSelect('policy.company', 'company')
        .skip(skip || 0)
        .take(limit || 100);

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

      const filterCompanyId =
        company_id !== undefined
          ? company_id
          : requesterCompanyId !== undefined && requesterCompanyId !== null
            ? requesterCompanyId
            : undefined;

      if (filterCompanyId !== undefined) {
        query.andWhere('company.id = :cid', { cid: filterCompanyId });
      }

      return await query.getMany();
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async findOne(id_policy: number) {
    const policy = await this.policyRepository.findOne({
      where: { id_policy },
      relations: ['user', 'company'],
    });

    if (!policy)
      throw new NotFoundException(`Policy with id ${id_policy} not found`);

    return policy;
  }

  async findByUser(userId: number, userCompanyId?: number) {
    const whereConditions: any = {
      user: { id: userId },
    };

    if (userCompanyId !== undefined && userCompanyId !== null) {
      whereConditions.company = { id: userCompanyId };
    }

    return await this.policyRepository.find({
      where: whereConditions,
      relations: ['user', 'company'],
    });
  }

  async update(
    id_policy: number,
    dto: UpdatePolicyDto,
    currentUser?: any,
    clientIp?: string,
  ) {
    console.log('DTO RECIBIDO EN UPDATE:', dto);
    try {
      const currentPolicy = await this.findOne(id_policy);

      // Snapshot plano del estado anterior (sin relaciones anidadas complejas)
      const previousSnapshot = {
        policy_number: currentPolicy.policy_number,
        tipo_poliza: currentPolicy.tipo_poliza,
        tipo_riesgo: currentPolicy.tipo_riesgo,
        placa: currentPolicy.placa,
        valor_asegurado: currentPolicy.valor_asegurado,
        valor_comercial: currentPolicy.valor_comercial,
        valor_accesorios: currentPolicy.valor_accesorios,
        valor_total_comercial: currentPolicy.valor_total_comercial,
        inicio_vigencia: currentPolicy.inicio_vigencia,
        fin_vigencia: currentPolicy.fin_vigencia,
        user_id: currentPolicy.user?.id || null,
        company_id: currentPolicy.company?.id || null,
      };

      const { user_id, inicio_vigencia, company_id, ...rest } = dto as any;
      const updateData: any = { ...rest };

      if (inicio_vigencia) {
        const fechaStr =
          typeof inicio_vigencia === 'string'
            ? inicio_vigencia.substring(0, 10)
            : inicio_vigencia.toISOString().substring(0, 10);

        const inicioDate = new Date(`${fechaStr}T12:00:00`);
        updateData.inicio_vigencia = inicioDate;
        updateData.fin_vigencia = addYears(inicioDate, 1);
      }

      const policyToSave = await this.policyRepository.preload({
        id_policy,
        ...updateData,
      });

      if (!policyToSave)
        throw new NotFoundException(`Policy with id ${id_policy} not found`);

      if (user_id) {
        const user = await this.userRepository.findOneBy({ id: +user_id });
        if (!user)
          throw new NotFoundException(`User with id ${user_id} not found`);
        policyToSave.user = user;
      }

      if (company_id !== undefined) {
        if (company_id !== null && company_id !== '') {
          policyToSave.company = { id: Number(company_id) } as any;
        } else {
          policyToSave.company = null as any;
        }
      }

      await this.policyRepository.save(policyToSave);

      // Reconsultamos para obtener el estado persistido definitivo
      const updatedPolicy = await this.findOne(id_policy);

      // Snapshot plano del nuevo estado
      const newSnapshot = {
        policy_number: updatedPolicy.policy_number,
        tipo_poliza: updatedPolicy.tipo_poliza,
        tipo_riesgo: updatedPolicy.tipo_riesgo,
        placa: updatedPolicy.placa,
        valor_asegurado: updatedPolicy.valor_asegurado,
        valor_comercial: updatedPolicy.valor_comercial,
        valor_accesorios: updatedPolicy.valor_accesorios,
        valor_total_comercial: updatedPolicy.valor_total_comercial,
        inicio_vigencia: updatedPolicy.inicio_vigencia,
        fin_vigencia: updatedPolicy.fin_vigencia,
        user_id: updatedPolicy.user?.id || null,
        company_id: updatedPolicy.company?.id || null,
      };

      // 📝 Registro de auditoría: MODIFICACIÓN
      await this.auditService.recordLog({
        userId: currentUser?.id || currentUser?.id_user || null,
        userEmail:
          currentUser?.email || currentUser?.user_name || 'Super Usuario',
        action: 'UPDATE',
        entity: 'Policy',
        entityId: String(id_policy),
        previousData: previousSnapshot,
        newData: newSnapshot,
        ipAddress: clientIp || null, // 👈 Se guarda la IP
      });

      return { message: 'Policy updated!', policy: updatedPolicy };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async remove(id_policy: number, currentUser?: any, clientIp?: string) {
    try {
      const currentPolicy = await this.findOne(id_policy);
      if (!currentPolicy)
        throw new NotFoundException(`Policy with id ${id_policy} not found`);

      const previousSnapshot = {
        policy_number: currentPolicy.policy_number,
        tipo_poliza: currentPolicy.tipo_poliza,
        tipo_riesgo: currentPolicy.tipo_riesgo,
        placa: currentPolicy.placa,
        valor_asegurado: currentPolicy.valor_asegurado,
        valor_comercial: currentPolicy.valor_comercial,
        valor_accesorios: currentPolicy.valor_accesorios,
        valor_total_comercial: currentPolicy.valor_total_comercial,
        inicio_vigencia: currentPolicy.inicio_vigencia,
        fin_vigencia: currentPolicy.fin_vigencia,
        user_id: currentPolicy.user?.id || null,
        company_id: currentPolicy.company?.id || null,
      };

      await this.policyRepository.delete({ id_policy });

      // 📝 Auditoría: Eliminación
      await this.auditService.recordLog({
        userId: currentUser?.id || currentUser?.id_user || null,
        userEmail:
          currentUser?.email || currentUser?.user_name || 'Super Usuario',
        action: 'DELETE',
        entity: 'Policy',
        entityId: String(id_policy),
        previousData: previousSnapshot,
        newData: null,
        ipAddress: clientIp || null, // 👈 Se asigna la IP
      });

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
