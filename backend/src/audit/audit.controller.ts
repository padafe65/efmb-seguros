import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/interfaces/valid-roles';
import { GetUser } from '../auth/decorators/get-user/get-user.decorator';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Auth(ValidRoles.super_user, ValidRoles.admin)
  async getLogs(@GetUser() user: any, @Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 100;
    return this.auditService.findAll(user, isNaN(take) ? 100 : take);
  }
}
