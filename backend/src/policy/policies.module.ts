import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyEntity } from './entities/policy.entity';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';

@Module({
  controllers: [PoliciesController],
  providers: [PoliciesService],
  imports: [
    TypeOrmModule.forFeature([PolicyEntity, UsersEntity]),
    NotificationsModule,
    WhatsappModule,
  ],
  exports: [TypeOrmModule, PoliciesService],
})
export class PoliciesModule {}
