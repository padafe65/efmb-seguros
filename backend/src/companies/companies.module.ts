import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { CompanyEntity } from './entities/company.entity';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService],
  imports: [TypeOrmModule.forFeature([CompanyEntity])],
  exports: [CompaniesService, TypeOrmModule],
})
export class CompaniesModule {}
