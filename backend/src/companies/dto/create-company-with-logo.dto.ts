import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyWithLogoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsString()
  nit?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  logo_url?: string; // Para URL externa

  @IsOptional()
  @IsString()
  color_primario?: string;

  @IsOptional()
  @IsString()
  color_secundario?: string;
}
