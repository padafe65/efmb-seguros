import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UsersEntity } from 'src/auth/entities/users.entity';
import { PolicyEntity } from 'src/policy/entities/policy.entity';
import { ContactMessageEntity } from 'src/contact/entities/contact-message.entity';

@Entity({ name: 'companies' })
export class CompanyEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false })
  nombre: string;

  @Column('text', { nullable: true })
  nit: string;

  @Column('text', { nullable: true })
  direccion: string;

  @Column('text', { nullable: true })
  telefono: string;

  @Column('text', { nullable: true })
  email: string;

  @Column('text', { nullable: true, name: 'whatsapp_number' })
  whatsapp_number: string;

  @Column('text', { nullable: true, name: 'facebook_url' })
  facebook_url: string;

  @Column('text', { nullable: true, name: 'logo_url' })
  logo_url: string;

  @Column('text', { nullable: true, name: 'color_primario', default: '#631025' })
  color_primario: string;

  @Column('text', { nullable: true, name: 'color_secundario', default: '#4c55d3' })
  color_secundario: string;

  @Column('boolean', { default: true })
  isactive: boolean;

  @Column('timestamp', { 
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at'
  })
  created_at: Date;

  // Relaciones
  @OneToMany(() => UsersEntity, (user) => user.company)
  users: UsersEntity[];

  @OneToMany(() => PolicyEntity, (policy) => policy.company)
  policies: PolicyEntity[];

  @OneToMany(() => ContactMessageEntity, (message) => message.company)
  contact_messages: ContactMessageEntity[];
}
