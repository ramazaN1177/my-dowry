import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Category } from './models/category.model';
import { Dowry } from './models/dowry.model';
import { Book } from './models/book.model';
import { Image } from './models/image.model';
import { User } from './models/user.model';

// Load environment variables
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is not defined');
    }

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connection established\n');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    throw error;
  }
};

const cleanupOrphanedData = async (): Promise<void> => {
  try {
    console.log('🧹 Starting cleanup of orphaned data...\n');

    // 1. Tüm geçerli Category ID'lerini al
    const validCategoryIds = await Category.find({}).distinct('_id');
    console.log(`📊 Found ${validCategoryIds.length} valid categories`);

    // 2. Geçersiz Category referansına sahip Dowry'leri bul ve sil
    const orphanedDowries = await Dowry.find({
      Category: { $nin: validCategoryIds }
    });
    
    let deletedDowriesCount = 0;
    if (orphanedDowries.length > 0) {
      // Dowry'lere ait resimleri de topla
      const dowryImageIds = orphanedDowries
        .filter(dowry => dowry.dowryImage)
        .map(dowry => dowry.dowryImage);
      
      // Dowry resimlerini sil
      if (dowryImageIds.length > 0) {
        const deletedDowryImages = await Image.deleteMany({
          _id: { $in: dowryImageIds }
        });
        console.log(`  🖼️  Deleted ${deletedDowryImages.deletedCount} images associated with orphaned dowries`);
      }

      // Orphaned dowry'leri sil
      const deletedDowries = await Dowry.deleteMany({
        Category: { $nin: validCategoryIds }
      });
      deletedDowriesCount = deletedDowries.deletedCount || 0;
      console.log(`  🗑️  Deleted ${deletedDowriesCount} orphaned dowries (invalid category reference)`);
    } else {
      console.log(`  ✅ No orphaned dowries found`);
    }

    // 3. Geçersiz Category referansına sahip Book'ları bul ve sil
    const orphanedBooks = await Book.find({
      Category: { $nin: validCategoryIds }
    });
    
    let deletedBooksCount = 0;
    if (orphanedBooks.length > 0) {
      const deletedBooks = await Book.deleteMany({
        Category: { $nin: validCategoryIds }
      });
      deletedBooksCount = deletedBooks.deletedCount || 0;
      console.log(`  📚 Deleted ${deletedBooksCount} orphaned books (invalid category reference)`);
    } else {
      console.log(`  ✅ No orphaned books found`);
    }

    // 4. Tüm geçerli User ID'lerini al
    const validUserIds = await User.find({}).distinct('_id');
    console.log(`\n📊 Found ${validUserIds.length} valid users`);

    // 5. Geçersiz userId'ye sahip Image'leri bul ve sil
    const orphanedImagesByUser = await Image.find({
      userId: { $nin: validUserIds }
    });
    
    let deletedImagesByUserCount = 0;
    if (orphanedImagesByUser.length > 0) {
      const deletedImagesByUser = await Image.deleteMany({
        userId: { $nin: validUserIds }
      });
      deletedImagesByUserCount = deletedImagesByUser.deletedCount || 0;
      console.log(`  🖼️  Deleted ${deletedImagesByUserCount} orphaned images (invalid user reference)`);
    } else {
      console.log(`  ✅ No orphaned images with invalid user found`);
    }

    // 6. Tüm geçerli Dowry ID'lerini al
    const validDowryIds = await Dowry.find({}).distinct('_id');
    console.log(`\n📊 Found ${validDowryIds.length} valid dowries`);

    // 7. Geçersiz dowryId'ye sahip Image'leri bul ve sil (dowryId varsa ama dowry yoksa)
    const orphanedImagesByDowry = await Image.find({
      dowryId: { $exists: true, $ne: null, $nin: validDowryIds }
    });
    
    let deletedImagesByDowryCount = 0;
    if (orphanedImagesByDowry.length > 0) {
      const deletedImagesByDowry = await Image.deleteMany({
        dowryId: { $exists: true, $ne: null, $nin: validDowryIds }
      });
      deletedImagesByDowryCount = deletedImagesByDowry.deletedCount || 0;
      console.log(`  🖼️  Deleted ${deletedImagesByDowryCount} orphaned images (invalid dowry reference)`);
    } else {
      console.log(`  ✅ No orphaned images with invalid dowry found`);
    }

    // Özet
    console.log('\n' + '='.repeat(50));
    console.log('📋 CLEANUP SUMMARY');
    console.log('='.repeat(50));
    console.log(`🗑️  Orphaned Dowries deleted: ${deletedDowriesCount}`);
    console.log(`📚 Orphaned Books deleted: ${deletedBooksCount}`);
    console.log(`🖼️  Orphaned Images (invalid user) deleted: ${deletedImagesByUserCount}`);
    console.log(`🖼️  Orphaned Images (invalid dowry) deleted: ${deletedImagesByDowryCount}`);
    console.log(`\n✅ Cleanup completed successfully!`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

const main = async (): Promise<void> => {
  try {
    await connectDB();
    await cleanupOrphanedData();
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

// Script'i çalıştır
main();