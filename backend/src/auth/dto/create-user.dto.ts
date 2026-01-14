import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ValidRoles } from '../interfaces/valid-roles';

export class CreateUserDTO {
  @IsString()
  @MinLength(3)
  user_name: string;

  @IsString()
  documento: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4)
  user_password: string;

  @IsString()
  @MinLength(7)
  direccion: string;

  @IsString()
  @MinLength(5)
  ciudad: string;

  @IsString()
  @MinLength(10)
  telefono: string;

  @IsOptional()
  @IsString()
  actividad_empresa?: string;

  @IsOptional()
  @IsString()
  representante_legal?: string;

  @IsOptional()
  @IsString()
  facebook_url?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fecha_nacimiento?: Date;

  @IsOptional()
  @IsBoolean()
  isactive?: boolean = true;

  @IsOptional()
  @IsArray()
  roles?: ValidRoles[] = [ValidRoles.user];
}
