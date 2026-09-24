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
      // 1. Instanciamos directamente la entidad para evitar el fallo de sobrecarga en .create()
      const log = new AuditLog();

      log.action = data.action;
      log.entity = data.entity;
      log.userId = data.userId ? Number(data.userId) : undefined;
      log.userEmail = data.userEmail || 'Sistema';
      log.entityId = data.entityId ? String(data.entityId) : undefined;
      log.ipAddress = data.ipAddress || '127.0.0.1';

      // 2. MySQL type: 'json' requiere un objeto JS o un JSON válido
      log.previousData =
        data.previousData !== undefined && data.previousData !== null
          ? data.previousData
          : undefined;

      log.newData =
        data.newData !== undefined && data.newData !== null
          ? data.newData
          : undefined;

      // 3. Guardar en base de datos
      await this.auditLogRepository.save(log);

      this.logger.log(
        `Auditoría registrada: [${data.action}] ${data.entity} (ID: ${log.entityId || 'N/A'}) por ${log.userEmail}`,
      );
    } catch (error) {
      this.logger.error('Error al guardar log de auditoría:', error);
    }
  }

  async findAll(limit = 100) {
    return await this.auditLogRepository.find({
      order: {
        id: 'DESC', // Los cambios más recientes siempre primero
      },
      take: limit,
    });
  }
}
