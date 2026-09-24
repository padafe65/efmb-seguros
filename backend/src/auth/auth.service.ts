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
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectRepository(UsersEntity)
    private readonly UsersRepository: Repository<UsersEntity>,

    private readonly configService: ConfigService,

    private readonly jwtService: JwtService,

    private readonly notificationsService: NotificationsService,

    private readonly auditService: AuditService,
  ) {}

  async createUserWithOptionalCreator(
    createUserDto: CreateUserDTO,
    authHeader?: string,
  ) {
    let creator: UsersEntity | null = null;

    // 1. Extraer el creador si viene token JWT
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload: any = this.jwtService.verify(token);
        if (payload?.id) {
          creator = await this.UsersRepository.findOne({
            where: { id: payload.id },
            relations: ['company'],
          });
        }
      } catch (err) {
        creator = null;
      }
    }

    const { user_password, company_id, roles, ...userData } = createUserDto;

    try {
      const hashedPassword = bcrypt.hashSync(
        user_password,
        Number(this.configService.get('SALT_ROUNDS_DEV') || 10),
      );

      const isSuperUser = creator?.roles?.includes('super_user' as any);
      const isAdmin = creator?.roles?.includes('admin' as any);

      // CASO 1: Auto-registro público
      let finalRoles: any = ['user'];
      let targetCompanyId: number | null = null;

      if (isSuperUser) {
        // CASO 2: Superusuario (asigna el rol y la empresa del formulario)
        finalRoles = roles && roles.length > 0 ? roles : ['user'];
        targetCompanyId = company_id ? Number(company_id) : null;
      } else if (isAdmin) {
        // CASO 3: Admin (asigna rol user y la empresa a la que pertenece el admin)
        finalRoles = ['user'];
        targetCompanyId = creator?.company?.id || null;
      }

      const userDataToCreate: any = {
        ...userData,
        user_password: hashedPassword,
        roles: finalRoles,
        created_by: creator ? creator.id : null,
      };

      if (targetCompanyId) {
        userDataToCreate.company = { id: targetCompanyId } as any;
      } else {
        userDataToCreate.company = null;
      }

      const user = this.UsersRepository.create(userDataToCreate);
      const savedUser: any = await this.UsersRepository.save(user);

      // 📝 Auditoría de creación de usuario
      await this.auditService.recordLog({
        userId: creator ? creator.id : savedUser.id,
        userEmail: creator ? creator.email : savedUser.email,
        action: 'CREATE',
        entity: 'User',
        entityId: String(savedUser.id),
        previousData: null,
        newData: {
          id: savedUser.id,
          user_name: savedUser.user_name,
          email: savedUser.email,
          documento: savedUser.documento,
          roles: finalRoles,
          company_id: targetCompanyId,
        },
      });

      return {
        user: {
          ...userData,
          roles: finalRoles,
          created_by: creator ? creator.id : null,
        },
        Message: 'User created successfully!!',
      };
    } catch (error) {
      this.handlerErrors(error);
    }
  }

  async loginUser(loginUserDTO: LoginUserDTO) {
    const { email, user_password } = loginUserDTO;

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

  async findAllUsers(
    params: {
      user_name?: string;
      email?: string;
      documento?: string;
      limit?: number;
      skip?: number;
      company_id?: number;
    },
    requesterCompanyId?: number,
  ) {
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

    if (company_id !== undefined) {
      whereConditions.company = { id: company_id };
    } else if (
      requesterCompanyId !== undefined &&
      requesterCompanyId !== null
    ) {
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
    const user = await this.UsersRepository.findOne({
      where: { id },
      relations: ['company'],
    });
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

    if (requesterCompanyId !== undefined && requesterCompanyId !== null) {
      whereConditions.forEach((condition) => {
        condition.company = { id: requesterCompanyId };
      });
    }

    return await this.UsersRepository.find({
      where: whereConditions,
      relations: ['company'],
      order: { id: 'ASC' },
    });
  }

  async deleteUser(id: number, currentUser?: any) {
    const user = await this.UsersRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    const { user_password: _pwd, ...userSnapshot } = user as any;

    await this.UsersRepository.delete(id);

    // 📝 Auditoría de eliminación
    await this.auditService.recordLog({
      userId: currentUser?.id || null,
      userEmail: currentUser?.email || 'Super Usuario',
      action: 'DELETE',
      entity: 'User',
      entityId: String(id),
      previousData: userSnapshot,
      newData: null,
    });

    return { message: `User ${id} deleted` };
  }

  async updateUser(userId: number, data: any, currentUser?: any) {
    const user = await this.UsersRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) throw new NotFoundException('User not found');

    // 📸 1. Snapshot del estado anterior (omitiendo contraseña)
    const { user_password: _pwd, ...previousSnapshot } = user as any;

    // Hasheo si cambia contraseña
    if (data && data.user_password) {
      data.user_password = bcrypt.hashSync(
        data.user_password,
        Number(this.configService.get('SALT_ROUNDS_DEV') || 10),
      );
    } else {
      if (data && 'user_password' in data && !data.user_password) {
        delete data.user_password;
      }
    }

    // Asignación de empresa
    if (data && 'company_id' in data) {
      if (data.company_id !== null && data.company_id !== undefined) {
        (user as any).company = { id: data.company_id };
      } else {
        (user as any).company = null;
      }
      delete data.company_id;
    }

    Object.assign(user, data);

    try {
      const savedUser = await this.UsersRepository.save(user);
      const { user_password, ...rest } = savedUser as any;

      // 📝 2. Log con el usuario autenticado que ejecutó la acción
      await this.auditService.recordLog({
        userId: currentUser?.id || currentUser?.id_user || null,
        userEmail:
          currentUser?.email || currentUser?.user_name || 'Super Usuario',
        action: 'UPDATE',
        entity: 'User',
        entityId: String(userId),
        previousData: previousSnapshot,
        newData: rest,
      });

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
  async updateUserRoles(userId: number, roles: string[], currentUser?: any) {
    const user = await this.UsersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    const validRoles = ['user', 'admin', 'sub_admin', 'super_user'];
    const rolesInvalidos = roles.filter((r) => !validRoles.includes(r));
    if (rolesInvalidos.length > 0) {
      throw new BadRequestException(
        `Roles inválidos: ${rolesInvalidos.join(', ')}`,
      );
    }

    const previousRoles = [...(user.roles || [])];

    user.roles = roles as any;
    await this.UsersRepository.save(user);

    const { user_password, ...rest } = user as any;

    // 📝 Log con el usuario autenticado que cambió los roles
    await this.auditService.recordLog({
      userId: currentUser?.id || currentUser?.id_user || null,
      userEmail:
        currentUser?.email || currentUser?.user_name || 'Super Usuario',
      action: 'UPDATE',
      entity: 'UserRoles',
      entityId: String(userId),
      previousData: { roles: previousRoles },
      newData: { roles: user.roles },
    });

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
      this.logger.warn(
        `Intento de restablecimiento para email no existente: ${email}`,
      );
      return {
        message:
          'Si el email existe, recibirás un correo con las instrucciones',
      };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    user.reset_password_token = resetToken;
    user.reset_password_expires = resetExpires;
    await this.UsersRepository.save(user);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.notificationsService.enviarEmailRestablecimiento(
        user.email,
        resetLink,
        user.user_name,
      );
      this.logger.log(`✅ Email de restablecimiento enviado a: ${email}`);
    } catch (error) {
      this.logger.error(
        `❌ Error enviando email de restablecimiento a ${email}`,
        error,
      );
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await this.UsersRepository.save(user);
      throw new BadRequestException(
        'Error al enviar el correo. Intenta nuevamente.',
      );
    }

    return {
      message: 'Si el email existe, recibirás un correo con las instrucciones',
    };
  }

  /**
   * Valida token y restablece la contraseña
   */
  async resetPasswordWithToken(token: string, newPassword: string) {
    const user = await this.UsersRepository.findOne({
      where: {
        reset_password_token: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido o expirado');
    }

    if (
      !user.reset_password_expires ||
      user.reset_password_expires < new Date()
    ) {
      user.reset_password_token = null;
      user.reset_password_expires = null;
      await this.UsersRepository.save(user);
      throw new BadRequestException(
        'Token expirado. Solicita un nuevo restablecimiento.',
      );
    }

    if (!newPassword || newPassword.length < 4) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 4 caracteres',
      );
    }

    const hashedPassword = bcrypt.hashSync(
      newPassword,
      Number(this.configService.get('SALT_ROUNDS_DEV') || 10),
    );

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

    if (
      !user.reset_password_expires ||
      user.reset_password_expires < new Date()
    ) {
      return { valid: false, message: 'Token expirado' };
    }

    return { valid: true, email: user.email };
  }

  private handlerErrors(error: any) {
    this.logger.error(error);

    if (
      error &&
      (error.code === 'ER_DUP_ENTRY' ||
        error.errno === 1062 ||
        error.code === '23505')
    ) {
      throw new BadRequestException(
        'El documento o correo electrónico ya se encuentra registrado en el sistema.',
      );
    }

    throw new BadRequestException(error?.message || 'Unexpected error');
  }

  private2() {
    return { ok: true };
  }
}
