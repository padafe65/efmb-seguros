import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersEntity } from './entities/users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt-strategy';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    ConfigModule,
    NotificationsModule, // Para enviar emails de restablecimiento

    TypeOrmModule.forFeature([
      UsersEntity
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt'
    }),


    //Importar JWTMODULE
    JwtModule.registerAsync(
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>{
          return{
            secret: configService.get('SECRET_JWT_KEY'),
            signOptions:{
              expiresIn:'2h'
            }
          }
        }
      }
    )


  ],
  exports: [
    TypeOrmModule
  ]
})
export class AuthModule {}
