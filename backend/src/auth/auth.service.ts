// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './entities/users.entity';
import { ILike, Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { LoginUserDTO } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { Payload } from './interfaces/jwt-payload.interface';
import { UpdateUserDTO } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(UsersEntity)
    private readonly UsersRepository: Repository<UsersEntity>,

    private readonly configService: ConfigService,

    private readonly jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDTO) {
    const { user_password, ...userData } = createUserDto;

    try {
      const user = this.UsersRepository.create({
        ...userData,
        user_password: bcrypt.hashSync(
          user_password,
          Number(this.configService.get('SALT_ROUNDS_DEV') || 10),
        ),
      });

      await this.UsersRepository.save(user);
      return {
        user: {
          ...userData,
        },
        Message: 'User created!!',
      };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async loginUser(loginUserDto: LoginUserDTO) {
    const { email, user_password } = loginUserDto;

    const user = await this.UsersRepository.findOne({
      select: {
        id: true,
        user_name: true,
        user_password: true,
        isactive: true,
        email: true,
        direccion: true,
        ciudad: true,
        roles: true,
      },
      where: { email },
    });

    if (!user)
      throw new NotFoundException(`User with email: ${email} not found`);

    const passOrNotPass = bcrypt.compareSync(user_password, user.user_password);

    if (!passOrNotPass) throw new UnauthorizedException(`Password not valid`);

    const payload = {
      id: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      Details: {
        Mesagge: 'Inicio de sesion exitoso!!',
        UserDetails: {
          name: user.user_name,
          email,
        },
      },
      token: this.jwtService.sign(payload),
    };
  }
  async findAllUsers(params: {
    user_name?: string;
    email?: string;
    documento?: string;
    limit?: number;
    skip?: number;
  }) {
    const { user_name, email, documento, limit, skip } = params;

    const whereConditions: any = {};

    if (user_name && user_name.trim() !== '') {
      whereConditions.user_name = ILike(`%${user_name}%`);
    }

    if (email && email.trim() !== '') {
      whereConditions.email = ILike(`%${email}%`);
    }

    if (documento && documento.trim() !== '') {
      whereConditions.documento = ILike(`%${documento}%`);
    }

    return this.UsersRepository.find({
      where: whereConditions,
      order: { id: 'ASC' },
      take: limit ?? undefined,
      skip: skip ?? undefined,
    });
  }

  async findUserById(id: number) {
    const user = await this.UsersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  async searchUsers(term: string) {
    if (!term) return [];

    return await this.UsersRepository.find({
      where: [
        { user_name: ILike(`%${term}%`) },
        { email: ILike(`%${term}%`) },
        { documento: ILike(`%${term}%`) },
      ],
      order: { id: 'ASC' },
    });
  }

  async deleteUser(id: number) {
    const user = await this.UsersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    await this.UsersRepository.delete(id);
    return { message: `User ${id} deleted` };
  }

  async updateUser(userId: number, data: any) {
    const user = await this.UsersRepository.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    // Si llega password y no es vacío, hashearla
    if (data && data.user_password) {
      data.user_password = bcrypt.hashSync(
        data.user_password,
        Number(this.configService.get('SALT_ROUNDS_DEV') || 10),
      );
    } else {
      // si el campo está presente pero vacío, eliminarlo para NO sobrescribir
      if (data && 'user_password' in data && !data.user_password) {
        delete data.user_password;
      }
    }

    Object.assign(user, data); // copiar cambios

    try {
      await this.UsersRepository.save(user);
      // devolver usuario sin password
      const { user_password, ...rest } = user as any;
      return {
        message: 'Usuario actualizado correctamente',
        user: rest,
      };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  /**
   * Actualiza los roles de un usuario (solo super_user puede hacerlo)
   */
  async updateUserRoles(userId: number, roles: string[]) {
    const user = await this.UsersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    // Validar que los roles sean válidos
    const validRoles = ['user', 'admin', 'super_user'];
    const rolesInvalidos = roles.filter(r => !validRoles.includes(r));
    if (rolesInvalidos.length > 0) {
      throw new BadRequestException(`Roles inválidos: ${rolesInvalidos.join(', ')}`);
    }

    user.roles = roles as any;
    await this.UsersRepository.save(user);

    const { user_password, ...rest } = user as any;
    return {
      message: 'Roles actualizados correctamente',
      user: rest,
    };
  }

  /**
   * Resetea la contraseña de un usuario por email (sin autenticación)
   * Permite cambiar la contraseña directamente con email y nueva contraseña
   */
  async resetPasswordByEmail(email: string, newPassword: string) {
    const user = await this.UsersRepository.findOne({ where: { email } });
    
    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }

    // Validar que la nueva contraseña tenga al menos 4 caracteres
    if (!newPassword || newPassword.length < 4) {
      throw new BadRequestException('La contraseña debe tener al menos 4 caracteres');
    }

    // Hashear la nueva contraseña
    const hashedPassword = bcrypt.hashSync(
      newPassword,
      Number(this.configService.get('SALT_ROUNDS_DEV') || 10),
    );

    // Actualizar la contraseña
    user.user_password = hashedPassword;
    await this.UsersRepository.save(user);

    this.logger.log(`✅ Contraseña actualizada para usuario: ${email}`);

    return {
      message: 'Contraseña actualizada correctamente',
      email: user.email,
    };
  }

  private handlerErrors(error: any) {
    if (error && error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new BadRequestException(error?.message || 'Unexpected error');
  }

  private2() {
    return { ok: true };
  }
}
