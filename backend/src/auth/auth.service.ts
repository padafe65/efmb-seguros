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
import { NotificationsService } from 'src/notifications/notifications.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(UsersEntity)
    private readonly UsersRepository: Repository<UsersEntity>,

    private readonly configService: ConfigService,

    private readonly jwtService: JwtService,

    private readonly notificationsService: NotificationsService,
  ) {}

  async createUser(createUserDto: CreateUserDTO, creatorCompanyId?: number) {
    const { user_password, ...userData } = createUserDto;

    try {
      const userDataToCreate: any = {
        ...userData,
        user_password: bcrypt.hashSync(
          user_password,
          Number(this.configService.get('SALT_ROUNDS_DEV') || 10),
        ),
      };

      // Si el creador tiene company_id, asignarlo al nuevo usuario
      if (creatorCompanyId) {
        userDataToCreate.company = { id: creatorCompanyId } as any;
      }

      const user = this.UsersRepository.create(userDataToCreate);

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
    company_id?: number; // Para filtrar por empresa
  }, requesterCompanyId?: number) {
    const { user_name, email, documento, limit, skip, company_id } = params;

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

    // Filtrar por company_id si se proporciona (super_user puede filtrar)
    // O si el requester es admin, solo ver su empresa
    if (company_id !== undefined) {
      whereConditions.company = { id: company_id };
    } else if (requesterCompanyId !== undefined && requesterCompanyId !== null) {
      // Admin solo ve usuarios de su empresa
      whereConditions.company = { id: requesterCompanyId };
    }

    return this.UsersRepository.find({
      where: whereConditions,
      relations: ['company'],
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

  async searchUsers(term: string, requesterCompanyId?: number) {
    if (!term) return [];

    const whereConditions: any[] = [
      { user_name: ILike(`%${term}%`) },
      { email: ILike(`%${term}%`) },
      { documento: ILike(`%${term}%`) },
    ];

    // Si el requester es admin, filtrar por su empresa
    if (requesterCompanyId !== undefined && requesterCompanyId !== null) {
      whereConditions.forEach(condition => {
        condition.company = { id: requesterCompanyId };
      });
    }

    return await this.UsersRepository.find({
      where: whereConditions,
      relations: ['company'],
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

    // Manejar company_id si viene en los datos
    if (data && 'company_id' in data) {
      if (data.company_id !== null && data.company_id !== undefined) {
        (user as any).company = { id: data.company_id };
      } else {
        (user as any).company = null;
      }
      delete data.company_id; // Eliminar del data para no sobrescribir
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
   * Solicita restablecimiento de contraseña - Genera token y envía email
   */
  async requestPasswordReset(email: string) {
    const user = await this.UsersRepository.findOne({ where: { email } });
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      this.logger.warn(`Intento de restablecimiento para email no existente: ${email}`);
      return {
        message: 'Si el email existe, recibirás un correo con las instrucciones',
      };
    }

    // Generar token único
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Expira en 1 hora

    // Guardar token en la base de datos
    user.reset_password_token = resetToken;
    user.reset_password_expires = resetExpires;
    await this.UsersRepository.save(user);

    // Generar enlace de restablecimiento
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Enviar email
    try {
      await this.notificationsService.enviarEmailRestablecimiento(
        user.email,
        resetLink,
        user.user_name,
      );
      this.logger.log(`✅ Email de restablecimiento enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando email de restablecimiento a ${email}`, error);
      // Limpiar token si falla el envío
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await this.UsersRepository.save(user);
      throw new BadRequestException('Error al enviar el correo. Intenta nuevamente.');
    }

    return {
      message: 'Si el email existe, recibirás un correo con las instrucciones',
    };
  }

  /**
   * Valida token y restablece la contraseña
   */
  async resetPasswordWithToken(token: string, newPassword: string) {
    // Buscar usuario con el token válido
    const user = await this.UsersRepository.findOne({
      where: {
        reset_password_token: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    // Verificar que el token no haya expirado
    if (!user.reset_password_expires || user.reset_password_expires < new Date()) {
      // Limpiar token expirado
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await this.UsersRepository.save(user);
      throw new BadRequestException('Token expirado. Solicita un nuevo restablecimiento.');
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

    // Actualizar contraseña y limpiar token
    user.user_password = hashedPassword;
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await this.UsersRepository.save(user);

    this.logger.log(`✅ Contraseña restablecida para usuario: ${user.email}`);

    return {
      message: 'Contraseña restablecida correctamente',
      email: user.email,
    };
  }

  /**
   * Valida si un token de restablecimiento es válido (sin cambiar contraseña)
   */
  async validateResetToken(token: string) {
    const user = await this.UsersRepository.findOne({
      where: {
        reset_password_token: token,
      },
    });

    if (!user) {
      return { valid: false, message: 'Token inválido' };
    }

    if (!user.reset_password_expires || user.reset_password_expires < new Date()) {
      return { valid: false, message: 'Token expirado' };
    }

    return { valid: true, email: user.email };
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
