import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 500, unique: true })
  purchaseToken: string;

  @Column({ type: 'varchar', length: 255 })
  packageName: string;

  @Column({ type: 'varchar', length: 255 })
  productId: string;

  @Column({ type: 'varchar', length: 50 })
  packageType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  orderId: string | null;

  @Column({ type: 'bigint', nullable: true })
  purchaseTimeMillis: number | null;

  @Column({ type: 'int', nullable: true })
  purchaseState: number | null;

  @Column({ type: 'boolean', default: false })
  isSubscription: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

