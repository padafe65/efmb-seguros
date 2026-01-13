// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  SetMetadata,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { LoginUserDTO } from './dto/login-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user/get-user.decorator';
import { ValidRoles } from './interfaces/valid-roles';
import { UserRolesGuard } from './guards/user-roles/user-roles.guard';
import { RoleProtected } from './decorators/role-protected/role-protected.decorator';
import { UpdateUserDTO } from './dto/update-user.dto';
import { Auth } from './decorators/auth.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Body() createUserDto: CreateUserDTO, @GetUser() user?: any) {
    // Si el usuario está logueado (admin), asignar su company_id
    const companyId = user?.company?.id || user?.company_id || undefined;
    return this.authService.createUser(createUserDto, companyId);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDTO) {
    return this.authService.loginUser(loginUserDto);
  }

  @Get('getUserExpress')
  @UseGuards(AuthGuard('jwt'))
  getUserExpress(@Req() req: Express.Request) {
    return req.user;
  }

  @Get('users')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  getAllUsers(@Query() query: any, @GetUser() user: any) {
    const { user_name, email, documento, limit, skip, company_id } = query;

    // Super_user puede filtrar por company_id, admin solo ve su empresa
    const requesterCompanyId = user.roles?.includes('super_user') 
      ? (company_id ? Number(company_id) : undefined)
      : (user.company?.id || user.company_id);

    return this.authService.findAllUsers({
      user_name,
      email,
      documento,
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
      company_id: company_id ? Number(company_id) : undefined,
    }, requesterCompanyId);
  }

  // Nuevo: obtener usuario por id (sin password)
  @Get('users/:id')
  getUserById(@Param('id') id: number) {
    return this.authService.findUserById(+id);
  }

  @Get('search')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  search(@Query('q') q: string, @GetUser() user: any) {
    const requesterCompanyId = user.roles?.includes('super_user') 
      ? undefined 
      : (user.company?.id || user.company_id);
    return this.authService.searchUsers(q, requesterCompanyId);
  }

  // Admin: actualizar cualquier usuario (NO puede cambiar password)
  @Patch('update/:id')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  async updateUserAdmin(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDTO,
  ) {
    // ensure password is not changed by admin (Option A)
    if ('user_password' in (updateUserDto as any)) {
      delete (updateUserDto as any).user_password;
    }
    return this.authService.updateUser(id, updateUserDto);
  }

  // Usuario autenticado: actualiza su propio perfil (puede cambiar password)
  @Patch('update')
  @Auth(ValidRoles.user)
  async updateUser(@GetUser() user, @Body() updateUserDto: UpdateUserDTO) {
    return this.authService.updateUser(user.id, updateUserDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  deleteUser(@Param('id') id: number) {
    return this.authService.deleteUser(+id);
  }

  // Super User: actualizar roles de cualquier usuario
  @Patch('users/:id/roles')
  @Auth(ValidRoles.super_user)
  async updateUserRoles(
    @Param('id') id: number,
    @Body() body: { roles: string[] },
  ) {
    return this.authService.updateUserRoles(+id, body.roles);
  }

  // Solicitar restablecimiento de contraseña (envía email con token)
  @Post('forgot-password')
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  // Validar token de restablecimiento
  @Get('validate-reset-token/:token')
  async validateResetToken(@Param('token') token: string) {
    return this.authService.validateResetToken(token);
  }

  // Restablecer contraseña con token
  @Patch('reset-password')
  async resetPasswordWithToken(
    @Body() body: { token: string; newPassword: string },
  ) {
    return this.authService.resetPasswordWithToken(body.token, body.newPassword);
  }
}
