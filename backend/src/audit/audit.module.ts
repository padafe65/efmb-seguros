import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport'; // 👈 Importa PassportModule directamente
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // 👈 Ya no depende de AuthModule
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
