import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger('CompaniesService');

  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
  ) {}

  async create(createDto: CreateCompanyDto, logoFile?: Express.Multer.File) {
    try {
      let logoUrl = createDto.logo_url;

      // Si hay un archivo subido, multer ya lo guardó en diskStorage
      if (logoFile && logoFile.filename) {
        // Multer ya guardó el archivo, solo necesitamos la URL
        logoUrl = `/uploads/logos/${logoFile.filename}`;
        this.logger.log(`✅ Logo guardado: ${logoUrl}`);
      }

      const company = this.companyRepository.create({
        nombre: createDto.nombre,
        nit: createDto.nit,
        direccion: createDto.direccion,
        telefono: createDto.telefono,
        email: createDto.email,
        whatsapp_number: createDto.whatsapp_number,
        facebook_url: createDto.facebook_url,
        logo_url: logoUrl,
        color_primario: createDto.color_primario || '#631025',
        color_secundario: createDto.color_secundario || '#4c55d3',
        isactive: true,
      });

      const savedCompany = await this.companyRepository.save(company);
      this.logger.log(`✅ Empresa creada: ${savedCompany.nombre} (ID: ${savedCompany.id})`);

      return savedCompany;
    } catch (error) {
      this.logger.error('Error creando empresa', error);
      throw error;
    }
  }

  async findAll(includeInactive: boolean = false) {
    const whereCondition = includeInactive ? {} : { isactive: true };
    return await this.companyRepository.find({
      where: whereCondition,
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
    }

    return company;
  }

  async update(id: number, updateDto: UpdateCompanyDto, logoFile?: Express.Multer.File) {
    const company = await this.findOne(id);

    // Si hay un archivo subido, multer ya lo guardó en diskStorage
    if (logoFile && logoFile.filename) {
      // Eliminar logo anterior si existe y no es una URL externa
      if (company.logo_url && company.logo_url.startsWith('/uploads/')) {
        const oldFilePath = path.join(process.cwd(), company.logo_url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Multer ya guardó el archivo, solo necesitamos la URL
      updateDto.logo_url = `/uploads/logos/${logoFile.filename}`;
      this.logger.log(`✅ Logo actualizado: ${updateDto.logo_url}`);
    }

    Object.assign(company, updateDto);
    const updatedCompany = await this.companyRepository.save(company);

    this.logger.log(`✅ Empresa actualizada: ${updatedCompany.nombre} (ID: ${id})`);

    return updatedCompany;
  }

  async toggleCompanyStatus(id: number) {
    const company = await this.findOne(id);
    
    // Cambiar el estado
    company.isactive = !company.isactive;
    await this.companyRepository.save(company);

    this.logger.log(
      `✅ Empresa ${company.isactive ? 'activada' : 'desactivada'}: ${company.nombre} (ID: ${id})`
    );

    return {
      message: `Empresa ${company.isactive ? 'activada' : 'desactivada'} correctamente`,
      company: {
        id: company.id,
        nombre: company.nombre,
        isactive: company.isactive,
      },
    };
  }

  async remove(id: number) {
    const company = await this.findOne(id);
    company.isactive = false;
    await this.companyRepository.save(company);

    this.logger.log(`✅ Empresa desactivada: ${company.nombre} (ID: ${id})`);

    return { message: 'Empresa desactivada correctamente' };
  }
}
