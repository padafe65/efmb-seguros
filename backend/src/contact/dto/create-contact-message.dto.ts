import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  asunto: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  mensaje: string;

  @IsOptional()
  @IsString()
  user_id?: number; // Opcional: si el usuario está logueado
}
