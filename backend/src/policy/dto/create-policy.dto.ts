// src/policy/dto/create-policy.dto.ts
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePolicyDto {
  @IsString()
  @MinLength(3)
  policy_number: string;

  @IsString()
  @MinLength(3)
  tipo_poliza: string;

  @Type(() => Date)
  @IsDate()
  inicio_vigencia: Date;

  // ❌ NO fin_vigencia (se calcula en el service)

  @IsOptional()
  @IsString()
  tipo_riesgo?: string;

  @IsOptional()
  @IsString()
  compania_seguros?: string;

  @IsOptional()
  @IsString()
  telefono_asistencia?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  valor_asegurado?: number;

  // relación con usuario
  @IsNumber()
  @Type(() => Number)
  user_id: number;

  // ---------- Vehículos ----------
  @IsOptional()
  @IsString()
  cod_fasecolda?: string;

  @IsOptional()
  @IsString()
  placa?: string;

  @IsOptional()
  @IsString()
  tonelaje_cilindraje_pasajeros?: string;

  @IsOptional()
  @IsString()
  departamento_municipio?: string;

  @IsOptional()
  @IsNumber()
  valor_comercial?: number;

  @IsOptional()
  @IsNumber()
  valor_accesorios?: number;

  @IsOptional()
  @IsNumber()
  valor_total_comercial?: number;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsString()
  servicio?: string;

  @IsOptional()
  @IsString()
  tipo_vehiculo?: string;

  @IsOptional()
  @IsString()
  numero_motor?: string;

  @IsOptional()
  @IsString()
  numero_chasis?: string;

  @IsOptional()
  @IsString()
  beneficiario?: string;
}
