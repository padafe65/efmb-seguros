// src/policy/policies.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { addMonths, startOfDay, endOfDay } from 'date-fns';
import { Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PolicyEntity } from './entities/policy.entity';
import { Repository } from 'typeorm';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { addYears } from 'date-fns';
import { NotificationsService } from 'src/notifications/notifications.service';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';

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

  async create(dto: CreatePolicyDto) {
    try {
      const user = await this.userRepository.findOneBy({ id: +dto.user_id });
      if (!user)
        throw new NotFoundException(`User with id ${dto.user_id} not found`);

      const { user_id, inicio_vigencia, ...rest } = dto;

      const inicio = new Date(inicio_vigencia);
      const fin = addYears(inicio, 1); // 🔥 1 año automático

      const policy = this.policyRepository.create({
        ...rest,
        inicio_vigencia: inicio,
        fin_vigencia: fin,
        user,
      });

      const saved = await this.policyRepository.save(policy);
      return {
        message: 'Policy created!',
        policy: saved,
      };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async findAllWithFilters(params: {
    userId?: string;
    policyNumber?: string;
    placa?: string;
    limit?: number;
    skip?: number;
  }) {
    try {
      const { userId, policyNumber, placa, limit, skip } = params;

      const query = this.policyRepository
        .createQueryBuilder('policy')
        .leftJoinAndSelect('policy.user', 'user')
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

      return await query.getMany();
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async findOne(id_policy: number) {
    const policy = await this.policyRepository.findOne({
      where: { id_policy },
      relations: ['user'],
    });

    if (!policy)
      throw new NotFoundException(`Policy with id ${id_policy} not found`);

    return policy;
  }

  async findByUser(userId: number) {
    return await this.policyRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async update(id_policy: number, dto: UpdatePolicyDto) {
    console.log('DTO RECIBIDO EN UPDATE:', dto);
    try {
      const { user_id, fin_vigencia, ...rest } = dto as any;

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

      if (user_id) {
        const user = await this.userRepository.findOneBy({ id: +user_id });
        if (!user)
          throw new NotFoundException(`User with id ${user_id} not found`);
        policy.user = user;
      }

      const saved = await this.policyRepository.save(policy);
      return { message: 'Policy updated!', policy: saved };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async remove(id_policy: number) {
    try {
      const policy = await this.findOne(id_policy);
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
