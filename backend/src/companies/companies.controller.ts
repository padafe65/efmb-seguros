import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Auth(ValidRoles.super_user)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `logo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Solo se permiten archivos de imagen'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  create(
    @Body() createDto: CreateCompanyDto,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    return this.companiesService.create(createDto, logoFile);
  }

  @Get()
  @Auth(ValidRoles.admin, ValidRoles.super_user)
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @Auth(ValidRoles.user, ValidRoles.admin, ValidRoles.super_user)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Auth(ValidRoles.super_user)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `logo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new Error('Solo se permiten archivos de imagen'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: any,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    // Parse JSON fields from FormData
    const parsedDto: UpdateCompanyDto = {
      nombre: updateDto.nombre || undefined,
      nit: updateDto.nit || undefined,
      direccion: updateDto.direccion || undefined,
      telefono: updateDto.telefono || undefined,
      email: updateDto.email || undefined,
      logo_url: updateDto.logo_url || undefined,
      color_primario: updateDto.color_primario || undefined,
      color_secundario: updateDto.color_secundario || undefined,
    };
    return this.companiesService.update(id, parsedDto, logoFile);
  }

  @Delete(':id')
  @Auth(ValidRoles.super_user)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.remove(id);
  }
}
