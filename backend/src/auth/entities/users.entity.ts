import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { ValidRoles } from '../interfaces/valid-roles';
import { PolicyEntity } from 'src/policy/entities/policy.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';

@Entity({ name: 'users' })
export class UsersEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false, name: 'user_name' })
  user_name: string;

  @Column('text', { nullable: false, unique: true })
  documento: string;

  @Column('boolean', { default: true, name: 'isactive' })
  isactive: boolean;

  @Column('text', { unique: true, nullable: false })
  email: string;

  @Column('text', { nullable: false })
  direccion: string;

  @Column('text', {
    nullable: false,
    name: 'user_password',
    select: false,
  })
  user_password: string;

  @Column('text', { nullable: false })
  ciudad: string;

  @Column('text', { nullable: true })
  telefono: string;

  @Column('text', { nullable: true })
  actividad_empresa: string;

  @Column('text', { nullable: true })
  representante_legal: string;

  @Column('date', { nullable: true })
  fecha_nacimiento: Date;

  @Column('enum', {
    enum: ValidRoles,
    array: true,
    default: [ValidRoles.user],
  })
  roles: ValidRoles[];

  // Campos para restablecimiento de contraseña
  @Column('text', { nullable: true, name: 'reset_password_token' })
  reset_password_token: string | null;

  @Column('timestamp', { nullable: true, name: 'reset_password_expires' })
  reset_password_expires: Date | null;

  // Relación con empresa/aseguradora
  @ManyToOne(() => CompanyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;

  @OneToMany(() => PolicyEntity, (policy) => policy.user)
  policies: PolicyEntity[];
}
