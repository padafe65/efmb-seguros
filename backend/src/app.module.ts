import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { PoliciesModule } from './policy/policies.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ContactModule } from './contact/contact.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot({
      type: 'mysql', // 👈 ESTE ERA EL PROBLEMA: debe decir 'mysql'
      host: process.env.DB_HOST || 'localhost',
      port: +process.env.DB_PORT! || 3306,
      database: process.env.DB_NAME || 'segurosmab',
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      autoLoadEntities: true,
      synchronize: true,
    }),
    CommonModule,
    PoliciesModule,
    AuthModule,
    NotificationsModule,
    WhatsappModule,
    ContactModule,
    CompaniesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
