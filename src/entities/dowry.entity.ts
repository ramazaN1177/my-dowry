import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

export enum DowryStatus {
  PURCHASED = 'purchased',
  NOT_PURCHASED = 'not_purchased'
}

@Entity('dowries')
export class Dowry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, category => category.dowries)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dowryPrice: number | null;

  @Column({ type: 'varchar', nullable: true })
  dowryLocation: string | null;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ 
    type: 'enum', 
    enum: DowryStatus, 
    default: DowryStatus.NOT_PURCHASED 
  })
  status: DowryStatus;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.dowries)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

