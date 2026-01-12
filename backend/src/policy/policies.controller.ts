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
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  create(@Body() dto: CreatePolicyDto) {
    return this.policiesService.create(dto);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  findAll(
    @Query('user_id') user_id?: string,
    @Query('policy_number') policy_number?: string,
    @Query('placa') placa?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number,
  ) {
    return this.policiesService.findAllWithFilters({
      userId: user_id,
      policyNumber: policy_number,
      placa,
      limit,
      skip,
    });
  }

  @Get(':id_policy')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  findOne(@Param('id_policy', ParseIntPipe) id_policy: number) {
    return this.policiesService.findOne(id_policy);
  }

  @Patch(':id_policy')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  update(
    @Param('id_policy', ParseIntPipe) id_policy: number,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.policiesService.update(id_policy, dto);
  }

  @Delete(':id_policy')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  remove(@Param('id_policy', ParseIntPipe) id_policy: number) {
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
    if (user.rol === 'user' && user.id !== userId) {
      throw new ForbiddenException(
        'No puede consultar pólizas de otro usuario',
      );
    }

    return this.policiesService.findByUser(userId);
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
