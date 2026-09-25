import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { ContactMessageEntity } from './entities/contact-message.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';
import { AuthModule } from 'src/auth/auth.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  controllers: [ContactController],
  providers: [ContactService],
  imports: [
    TypeOrmModule.forFeature([
      ContactMessageEntity,
      UsersEntity,
      CompanyEntity,
    ]),
    NotificationsModule,
    AuthModule,
    AuditModule,
  ],
  exports: [ContactService],
})
export class ContactModule {}
