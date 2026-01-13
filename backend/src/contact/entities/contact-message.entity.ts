import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { CompanyEntity } from 'src/companies/entities/company.entity';

@Entity({ name: 'contact_messages' })
export class ContactMessageEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false })
  nombre: string;

  @Column('text', { nullable: false })
  email: string;

  @Column('text', { nullable: false })
  asunto: string;

  @Column('text', { nullable: false })
  mensaje: string;

  // Relación opcional con usuario (si está logueado)
  @ManyToOne(() => UsersEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'user_id' })
  user?: UsersEntity;

  @Column('timestamp', { 
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at'
  })
  created_at: Date;

  @Column('boolean', { default: false })
  leido: boolean;

  @Column('boolean', { default: false })
  respondido: boolean;

  @Column('text', { nullable: true })
  respuesta?: string;

  @Column('timestamp', { nullable: true, name: 'responded_at' })
  responded_at?: Date;

  // Relación con el usuario que respondió (admin/super_user)
  @ManyToOne(() => UsersEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'responded_by' })
  responded_by_user?: UsersEntity;

  // Relación con empresa/aseguradora
  @ManyToOne(() => CompanyEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'company_id' })
  company?: CompanyEntity;
}
