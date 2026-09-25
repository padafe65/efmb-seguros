import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async recordLog(data: {
    userId?: number | null;
    userEmail?: string | null;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: string;
    entityId?: string | null;
    previousData?: any;
    newData?: any;
    ipAddress?: string | null;
  }) {
    try {
      const log = new AuditLog();

      log.action = data.action;
      log.entity = data.entity;
      log.userId = data.userId ? Number(data.userId) : undefined;
      log.userEmail = data.userEmail || 'Sistema';
      log.entityId = data.entityId ? String(data.entityId) : undefined;
      log.ipAddress = data.ipAddress || '127.0.0.1';

      log.previousData =
        data.previousData !== undefined && data.previousData !== null
          ? data.previousData
          : undefined;

      log.newData =
        data.newData !== undefined && data.newData !== null
          ? data.newData
          : undefined;

      await this.auditLogRepository.save(log);

      this.logger.log(
        `Auditoría registrada: [\({data.action}]\){data.entity} (ID: \({log.entityId || 'N/A'}) por\){log.userEmail}`,
      );
    } catch (error) {
      this.logger.error('Error al guardar log de auditoría:', error);
    }
  }

  async findAll(user: any, limit = 100) {
    const isSuperUser = user?.roles?.includes('super_user');
    const userCompanyId = user?.company?.id || user?.company_id;

    // Si es super_user, devuelve los logs globales sin restricción
    if (isSuperUser) {
      return await this.auditLogRepository.find({
        order: { id: 'DESC' },
        take: limit,
      });
    }

    // Si es admin, filtra exclusivamente eventos de su empresa
    const qb = this.auditLogRepository
      .createQueryBuilder('audit')
      .orderBy('audit.id', 'DESC')
      .take(limit);

    if (userCompanyId) {
      qb.where(
        `(
          JSON_UNQUOTE(JSON_EXTRACT(audit.newData, '$.company_id')) = :compId OR
          JSON_UNQUOTE(JSON_EXTRACT(audit.newData, '$.company.id')) = :compId OR
          JSON_UNQUOTE(JSON_EXTRACT(audit.previousData, '$.company_id')) = :compId OR
          JSON_UNQUOTE(JSON_EXTRACT(audit.previousData, '$.company.id')) = :compId OR
          audit.userId = :userId
        )`,
        { compId: String(userCompanyId), userId: user.id },
      );
    } else {
      qb.where('audit.userId = :userId', { userId: user.id });
    }

    return await qb.getMany();
  }
}
