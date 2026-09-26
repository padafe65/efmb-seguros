import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';

@Entity({ name: 'policies' })
export class PolicyEntity {
  @PrimaryGeneratedColumn({ name: 'id_policy' })
  id_policy: number;

  @Column('text', { nullable: false, unique: true })
  policy_number: string;

  @ManyToOne(() => UsersEntity, (user) => user.policies, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: UsersEntity;

  // ---------- Creador de la póliza (Llave Foránea) ----------
  @Column({ name: 'created_by', type: 'int', nullable: true })
  created_by: number | null;

  @ManyToOne(() => UsersEntity, {
    nullable: true,
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'created_by' })
  creator: UsersEntity | null;

  // ---------- Campos generales ----------
  @Column('text', { nullable: false })
  tipo_poliza: string;

  @Column('date', { nullable: false })
  inicio_vigencia: Date;

  @Column('date', { nullable: false })
  fin_vigencia: Date;

  @Column('text', { nullable: true })
  tipo_riesgo: string;

  @Column('text', { nullable: true })
  compania_seguros: string;

  @Column('text', { nullable: true })
  telefono_asistencia: string;

  @Column('numeric', { nullable: true })
  valor_asegurado: number;

  // ---------- Campos vehículos (opcionales) ----------
  @Column('text', { nullable: true })
  cod_fasecolda: string;

  @Column('text', { nullable: true })
  placa: string;

  @Column('text', { nullable: true })
  tonelaje_cilindraje_pasajeros: string;

  @Column('text', { nullable: true })
  departamento_municipio: string;

  @Column('numeric', { nullable: true })
  valor_comercial: number;

  @Column('numeric', { nullable: true })
  valor_accesorios: number;

  @Column('numeric', { nullable: true })
  valor_total_comercial: number;

  @Column('text', { nullable: true })
  modelo: string;

  @Column('text', { nullable: true })
  servicio: string;

  @Column('text', { nullable: true })
  tipo_vehiculo: string;

  @Column('text', { nullable: true })
  numero_motor: string;

  @Column('text', { nullable: true })
  numero_chasis: string;

  @Column('text', { nullable: true })
  beneficiario: string;

  @Column('boolean', { default: false })
  notificada: boolean;

  // Relación con empresa/aseguradora
  @ManyToOne(() => CompanyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;
}
