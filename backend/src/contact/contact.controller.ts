import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { RespondMessageDto } from './dto/respond-message.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { GetUser } from 'src/auth/decorators/get-user/get-user.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // Endpoint público para enviar mensajes
  @Post('send-message')
  async sendMessage(
    @Body() createDto: CreateContactMessageDto,
    @GetUser() user?: any,
  ) {
    // Si el usuario está logueado, usar su company_id
    const userCompanyId = user?.company?.id || user?.company_id || undefined;
    return this.contactService.createMessage(createDto, userCompanyId);
  }

  // Endpoints protegidos para administradores
  @Get('messages')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  async getAllMessages(@GetUser() user: any) {
    // Super_user ve todos, admin solo ve su empresa
    const requesterCompanyId = user.roles?.includes('super_user')
      ? undefined
      : (user.company?.id || user.company_id);
    return this.contactService.findAll(requesterCompanyId);
  }

  @Get('messages/:id')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  async getMessage(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.findOne(id);
  }

  @Patch('messages/:id/read')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  async markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.markAsRead(id);
  }

  @Patch('messages/:id/respond')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  async respondToMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() respondDto: RespondMessageDto,
    @GetUser() user: any,
  ) {
    return this.contactService.respondToMessage(id, respondDto, user.id);
  }

  @Delete('messages/:id')
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  async deleteMessage(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.deleteMessage(id);
  }
}
