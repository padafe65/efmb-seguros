// src/policy/policies.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user/get-user.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  // ===============================
  // ADMIN / SUPER_USER
  // ===============================

  @Post('create')
  @Auth(ValidRoles.admin, ValidRoles.super_user, ValidRoles.sub_admin)
  create(@Body() dto: CreatePolicyDto, @GetUser() user: any) {
    const companyId = user.company?.id || user.company_id || undefined;
    const creatorId = user.id;
    const creatorRoles = user.roles || [];
    // Determinar el rol del creador (admin o sub_admin)
    const creatorRole = creatorRoles.includes(ValidRoles.super_user) 
      ? ValidRoles.admin // super_user se considera admin para este propósito
      : (creatorRoles.includes(ValidRoles.admin) ? ValidRoles.admin : ValidRoles.sub_admin);
    
    return this.policiesService.create(dto, companyId, creatorId, creatorRole);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.super_user, ValidRoles.sub_admin)
  findAll(
    @Query('user_id') user_id?: string,
    @Query('policy_number') policy_number?: string,
    @Query('placa') placa?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
    @Query('company_id') company_id?: string,
    @GetUser() user?: any,
  ) {
    // Super_user puede filtrar por company_id, admin solo ve su empresa
    const requesterCompanyId = user?.roles?.includes('super_user') 
      ? (company_id ? Number(company_id) : undefined)
      : (user?.company?.id || user?.company_id);
    
    // Pasar información del usuario para filtrado (sub_admin solo ve sus propias pólizas)
    const requesterId = user?.id;
    const requesterRoles = user?.roles || [];

    return this.policiesService.findAllWithFilters({
      userId: user_id,
      policyNumber: policy_number,
      placa,
      limit,
      skip,
      company_id: company_id ? Number(company_id) : undefined,
    }, requesterCompanyId, requesterId, requesterRoles);
  }

  @Get(':id_policy')
  @Auth(ValidRoles.admin, ValidRoles.super_user, ValidRoles.sub_admin)
  findOne(@Param('id_policy', ParseIntPipe) id_policy: number, @GetUser() user?: any) {
    // Verificar permisos: sub_admin solo puede ver sus propias pólizas
    const requesterRoles = user?.roles || [];
    const isSubAdmin = requesterRoles.includes(ValidRoles.sub_admin);
    
    if (isSubAdmin) {
      // Para sub_admin, verificar que la póliza fue creada por él
      return this.policiesService.findOne(id_policy, user?.id);
    }
    
    return this.policiesService.findOne(id_policy);
  }

  @Patch(':id_policy')
  @Auth(ValidRoles.admin, ValidRoles.super_user, ValidRoles.sub_admin)
  update(
    @Param('id_policy', ParseIntPipe) id_policy: number,
    @Body() dto: UpdatePolicyDto,
    @GetUser() user?: any,
  ) {
    // Verificar permisos: sub_admin solo puede editar sus propias pólizas
    const requesterRoles = user?.roles || [];
    const isSubAdmin = requesterRoles.includes(ValidRoles.sub_admin);
    
    if (isSubAdmin) {
      // Para sub_admin, verificar que la póliza fue creada por él
      return this.policiesService.update(id_policy, dto, user?.id);
    }
    
    return this.policiesService.update(id_policy, dto);
  }

  @Delete(':id_policy')
  @Auth(ValidRoles.admin, ValidRoles.super_user, ValidRoles.sub_admin)
  remove(
    @Param('id_policy', ParseIntPipe) id_policy: number,
    @GetUser() user?: any,
  ) {
    // Verificar permisos: sub_admin solo puede eliminar sus propias pólizas
    const requesterRoles = user?.roles || [];
    const isSubAdmin = requesterRoles.includes(ValidRoles.sub_admin);
    
    if (isSubAdmin) {
      // Para sub_admin, verificar que la póliza fue creada por él
      return this.policiesService.remove(id_policy, user?.id);
    }
    
    return this.policiesService.remove(id_policy);
  }

  // ===============================
  // USER (solo sus pólizas)
  // ===============================

  @Get('user/:userId')
  @Auth(ValidRoles.user, ValidRoles.admin, ValidRoles.super_user)
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() user: any,
  ) {
    // 🔐 si es USER, solo puede consultar sus propias pólizas
    if (user.roles?.includes('user') && user.id !== userId) {
      throw new ForbiddenException(
        'No puede consultar pólizas de otro usuario',
      );
    }

    // Obtener company_id del usuario para filtrar
    const userCompanyId = user.company?.id || user.company_id;
    return this.policiesService.findByUser(userId, userCompanyId);
  }

  // Endpoint para que usuarios vean sus propias pólizas individuales
  @Get('user-policy/:id_policy')
  @Auth(ValidRoles.user, ValidRoles.admin, ValidRoles.super_user)
  async findUserPolicy(
    @Param('id_policy', ParseIntPipe) id_policy: number,
    @GetUser() user: any,
  ) {
    const policy = await this.policiesService.findOne(id_policy);
    
    // 🔐 si es USER, solo puede ver sus propias pólizas
    if (user.roles?.includes('user') && policy.user.id !== user.id) {
      throw new ForbiddenException(
        'No puede ver pólizas de otro usuario',
      );
    }

    return policy;
  }

  @Post('test/verificar-vencimientos')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  async ejecutarCronManual() {
    await this.policiesService.verificarPolizasPorVencer();
    return {
      ok: true,
      message: 'CRON de vencimientos ejecutado manualmente',
    };
  }
}
