import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RespondMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  respuesta: string;
}
