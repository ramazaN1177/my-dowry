import { getMinioClientInstance, getBucketName } from '../config/minio.config';

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
    const client = getMinioClientInstance();
    const bucketName = getBucketName();
    
    await client.putObject(
      bucketName,
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
    const client = getMinioClientInstance();
    const bucketName = getBucketName();
    const stream = await client.getObject(bucketName, minioPath);
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
    const client = getMinioClientInstance();
    const bucketName = getBucketName();
    await client.removeObject(bucketName, minioPath);
  }

  /**
   * Presigned URL oluştur (7 gün geçerli)
   * Geçici erişim için kullanılır
   */
  static async getPresignedUrl(minioPath: string, expiryInSeconds: number = 7 * 24 * 60 * 60): Promise<string> {
    const client = getMinioClientInstance();
    const bucketName = getBucketName();
    return await client.presignedGetObject(bucketName, minioPath, expiryInSeconds);
  }

  /**
   * Public URL oluştur (süresiz - bucket public ise)
   * Sürekli görsel gösterme için kullanılır
   */
  static getPublicUrl(minioPath: string): string {
    const baseUrl = getMinioPublicUrl();
    const bucketName = getBucketName();
    return `${baseUrl}/${bucketName}/${minioPath}`;
  }

  /**
   * Public URL'den minioPath çıkarır
   * Format: http://host:port/bucket-name/minioPath
   */
  static extractMinioPathFromUrl(imageUrl: string): string | null {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      const bucketName = getBucketName();
      const bucketIndex = pathParts.findIndex(part => part === bucketName);
      if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch (error) {
      console.error('Error extracting minioPath from URL:', error);
      return null;
    }
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
      const client = getMinioClientInstance();
      const bucketName = getBucketName();
      await client.statObject(bucketName, minioPath);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}

