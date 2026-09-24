import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ type: 'int', nullable: true })
  userId?: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  userEmail?: string;

  @Column({ type: 'varchar', length: 50 })
  action!: 'CREATE' | 'UPDATE' | 'DELETE';

  @Column({ type: 'varchar', length: 100 })
  entity!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entityId?: string;

  @Column({ type: 'json', nullable: true })
  previousData?: any;

  @Column({ type: 'json', nullable: true })
  newData?: any;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
