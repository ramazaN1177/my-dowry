import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Dowry } from './dowry.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  contentType: string;

  @Column({ type: 'bigint' })
  size: number;

  // MinIO'da saklanacak dosya yolu
  @Column({ type: 'varchar', length: 500 })
  minioPath: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.images)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  dowryId: string | null;

  @ManyToOne(() => Dowry, dowry => dowry.images, { nullable: true })
  @JoinColumn({ name: 'dowryId' })
  dowry: Dowry | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

