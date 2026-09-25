import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuditService } from '../audit/audit.service';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger('CompaniesService');

  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepository: Repository<CompanyEntity>,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createDto: CreateCompanyDto,
    logoFile?: Express.Multer.File,
    currentUser?: any,
    clientIp?: string,
  ) {
    try {
      let logoUrl = createDto.logo_url;

      // Si hay un archivo subido, multer ya lo guardó en diskStorage
      if (logoFile && logoFile.filename) {
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
      this.logger.log(
        `✅ Empresa creada: \({savedCompany.nombre} (ID:\){savedCompany.id})`,
      );

      // 📝 Auditoría de creación de empresa
      await this.auditService.recordLog({
        userId: currentUser?.id || currentUser?.id_user || null,
        userEmail: currentUser?.email || 'Super Usuario',
        action: 'CREATE',
        entity: 'Company',
        entityId: String(savedCompany.id),
        previousData: null,
        newData: savedCompany,
        ipAddress: clientIp,
      });

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

  async update(
    id: number,
    updateDto: UpdateCompanyDto,
    logoFile?: Express.Multer.File,
    currentUser?: any,
    clientIp?: string,
  ) {
    const company = await this.findOne(id);
    const previousSnapshot = { ...company };

    // Si hay un archivo subido, multer ya lo guardó en diskStorage
    if (logoFile && logoFile.filename) {
      // Eliminar logo anterior si existe y no es una URL externa
      if (company.logo_url && company.logo_url.startsWith('/uploads/')) {
        const oldFilePath = path.join(process.cwd(), company.logo_url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      updateDto.logo_url = `/uploads/logos/${logoFile.filename}`;
      this.logger.log(`✅ Logo actualizado: ${updateDto.logo_url}`);
    }

    Object.assign(company, updateDto);
    const updatedCompany = await this.companyRepository.save(company);

    this.logger.log(
      `✅ Empresa actualizada: \({updatedCompany.nombre} (ID:\){id})`,
    );

    // 📝 Auditoría de actualización
    await this.auditService.recordLog({
      userId: currentUser?.id || currentUser?.id_user || null,
      userEmail: currentUser?.email || 'Super Usuario',
      action: 'UPDATE',
      entity: 'Company',
      entityId: String(id),
      previousData: previousSnapshot,
      newData: updatedCompany,
      ipAddress: clientIp,
    });

    return updatedCompany;
  }

  async toggleCompanyStatus(id: number, currentUser?: any, clientIp?: string) {
    const company = await this.findOne(id);
    const previousSnapshot = { ...company };

    company.isactive = !company.isactive;
    const savedCompany = await this.companyRepository.save(company);

    this.logger.log(
      `✅ Empresa \({company.isactive ? 'activada' : 'desactivada'}:\){company.nombre} (ID: ${id})`,
    );

    // 📝 Auditoría de cambio de estado
    await this.auditService.recordLog({
      userId: currentUser?.id || currentUser?.id_user || null,
      userEmail: currentUser?.email || 'Super Usuario',
      action: 'UPDATE',
      entity: 'CompanyStatus',
      entityId: String(id),
      previousData: previousSnapshot,
      newData: savedCompany,
      ipAddress: clientIp,
    });

    return {
      message: `Empresa ${company.isactive ? 'activada' : 'desactivada'} correctamente`,
      company: {
        id: company.id,
        nombre: company.nombre,
        isactive: company.isactive,
      },
    };
  }

  async remove(id: number, currentUser?: any, clientIp?: string) {
    const company = await this.findOne(id);
    const previousSnapshot = { ...company };

    company.isactive = false;
    const deactivatedCompany = await this.companyRepository.save(company);

    this.logger.log(`✅ Empresa desactivada: \({company.nombre} (ID:\){id})`);

    // 📝 Auditoría de eliminación lógica
    await this.auditService.recordLog({
      userId: currentUser?.id || currentUser?.id_user || null,
      userEmail: currentUser?.email || 'Super Usuario',
      action: 'DELETE',
      entity: 'Company',
      entityId: String(id),
      previousData: previousSnapshot,
      newData: deactivatedCompany,
      ipAddress: clientIp,
    });

    return { message: 'Empresa desactivada correctamente' };
  }
}
