import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';

export enum BookStatus {
  PURCHASED = 'purchased',
  NOT_PURCHASED = 'not_purchased'
}

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  author: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, category => category.books)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ 
    type: 'enum', 
    enum: BookStatus, 
    default: BookStatus.NOT_PURCHASED 
  })
  status: BookStatus;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.books)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

