import { PartialType } from '@nestjs/mapped-types';
import { CreatePolicyDto } from './create-policy.dto';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';

export class UpdatePolicyDto extends PartialType(CreatePolicyDto) {
  // Campos editables por admin y super_user
  @IsOptional()
  @IsNumber()
  created_by_id?: number;

  @IsOptional()
  @IsString()
  created_by_role?: string;

  // Campo para actualizar la compañía (solo admin y super_user pueden modificar)
  @IsOptional()
  @IsNumber()
  company_id?: number;

  // Campo para actualizar el estado de notificación (solo admin y super_user pueden modificar)
  @IsOptional()
  @IsBoolean()
  notificada?: boolean;
}
