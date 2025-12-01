import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { Dowry } from '../entities/dowry.entity';
import { Book } from '../entities/book.entity';
import { ensureBucketExists } from '../config/minio.config';

let AppDataSource: DataSource;

const connectDB = async (): Promise<void> => {
  try {
    AppDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Category, Dowry, Book],
      synchronize: process.env.NODE_ENV !== 'production', // Development'ta auto-sync, production'da false
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : false,
    });

    await AppDataSource.initialize();
    console.log('✅ PostgreSQL connection established');
    
    // MinIO bucket'ı kontrol et
    await ensureBucketExists();
    console.log('✅ MinIO bucket ready');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

export { AppDataSource };
export default connectDB;
