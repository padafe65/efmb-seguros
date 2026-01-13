import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersEntity } from '../entities/users.entity';
import { ObjectType, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly UsersRepository: Repository<UsersEntity>,

    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('SECRET_JWT_KEY')!,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payLoad: Payload): Promise<Object> {
    const { id } = payLoad; // AHORA OBTIENES "id"

    const userFound = await this.UsersRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!userFound) throw new UnauthorizedException(`User not found`);
    if (!userFound.isactive)
      throw new UnauthorizedException(`User is inactive, talk with an admin`);

    return userFound;
  }
}
