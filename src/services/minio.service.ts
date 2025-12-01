import { minioClient, BUCKET_NAME } from '../config/minio.config';

// Public URL için endpoint bilgisi
const getMinioPublicUrl = (): string => {
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  // URL'den protocol, host ve port bilgisini al
  const url = new URL(endpoint);
  const port = url.port || (url.protocol === 'https:' ? '443' : '9000');
  return `${url.protocol}//${url.hostname}:${port}`;
};

export class MinioService {
  /**
   * Dosyayı MinIO'ya yükle
   */
  static async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    userId: string
  ): Promise<string> {
    const minioPath = `users/${userId}/images/${fileName}`;
    
    await minioClient.putObject(
      BUCKET_NAME,
      minioPath,
      buffer,
      buffer.length,
      {
        'Content-Type': contentType,
      }
    );

    return minioPath;
  }

  /**
   * Dosyayı MinIO'dan indir
   */
  static async downloadFile(minioPath: string): Promise<Buffer> {
    const stream = await minioClient.getObject(BUCKET_NAME, minioPath);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Dosyayı MinIO'dan sil
   */
  static async deleteFile(minioPath: string): Promise<void> {
    await minioClient.removeObject(BUCKET_NAME, minioPath);
  }

  /**
   * Presigned URL oluştur (7 gün geçerli)
   * Geçici erişim için kullanılır
   */
  static async getPresignedUrl(minioPath: string, expiryInSeconds: number = 7 * 24 * 60 * 60): Promise<string> {
    return await minioClient.presignedGetObject(BUCKET_NAME, minioPath, expiryInSeconds);
  }

  /**
   * Public URL oluştur (süresiz - bucket public ise)
   * Sürekli görsel gösterme için kullanılır
   */
  static getPublicUrl(minioPath: string): string {
    const baseUrl = getMinioPublicUrl();
    return `${baseUrl}/${BUCKET_NAME}/${minioPath}`;
  }

  /**
   * Presigned URL veya Public URL döndürür
   * Bucket public ise public URL, değilse presigned URL döndürür
   */
  static async getUrl(minioPath: string, usePublic: boolean = false, expiryInSeconds?: number): Promise<string> {
    if (usePublic) {
      return this.getPublicUrl(minioPath);
    }
    return this.getPresignedUrl(minioPath, expiryInSeconds);
  }

  /**
   * Dosya var mı kontrol et
   */
  static async fileExists(minioPath: string): Promise<boolean> {
    try {
      await minioClient.statObject(BUCKET_NAME, minioPath);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}

