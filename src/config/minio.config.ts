import * as Minio from 'minio';

// MinIO endpoint'i parse et
const parseMinioEndpoint = (endpoint: string): { host: string; port: number; useSSL: boolean } => {
  try {
    const url = new URL(endpoint);
    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 9000),
      useSSL: url.protocol === 'https:'
    };
  } catch (error) {
    console.error('Error parsing MinIO endpoint:', endpoint, error);
    throw new Error(`Invalid MinIO endpoint: ${endpoint}`);
  }
};

// MinIO client'ı dinamik olarak oluştur (environment variables yüklendikten sonra)
const getMinioClient = (): Minio.Client => {
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
  const endpointConfig = parseMinioEndpoint(endpoint);

  return new Minio.Client({
    endPoint: endpointConfig.host,
    port: endpointConfig.port,
    useSSL: endpointConfig.useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });
};

// MinIO client'ı lazy initialization ile oluştur
let minioClientInstance: Minio.Client | null = null;

const getMinioClientInstance = (): Minio.Client => {
  // Her zaman yeniden oluştur (environment variables değişebilir)
  minioClientInstance = getMinioClient();
  return minioClientInstance;
};

const getBucketName = (): string => {
  return process.env.MINIO_BUCKET_NAME || 'mydowry-images';
};

// Bucket'ı oluştur (yoksa)
const ensureBucketExists = async (): Promise<void> => {
  try {
    const client = getMinioClientInstance(); // Her zaman fresh client
    const bucketName = getBucketName();
    
    const exists = await client.bucketExists(bucketName);
    if (!exists) {
      await client.makeBucket(bucketName, 'us-east-1');
    }
  } catch (error) {
    console.error('❌ Error creating bucket:', error);
    throw error;
  }
};

// Bucket'ı public yap (herkese okuma izni ver)
const makeBucketPublic = async (): Promise<void> => {
  try {
    const client = getMinioClientInstance();
    const bucketName = getBucketName();
    
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };

    await client.setBucketPolicy(bucketName, JSON.stringify(policy));
  } catch (error) {
    console.error('Error making bucket public:', error);
    throw error;
  }
};

// Export - lazy getter kullan
const minioClient = (() => {
  let instance: Minio.Client | null = null;
  return new Proxy({} as Minio.Client, {
    get(target, prop) {
      if (!instance) {
        instance = getMinioClientInstance();
      }
      const value = (instance as any)[prop];
      return typeof value === 'function' ? value.bind(instance) : value;
    }
  });
})();

const BUCKET_NAME = getBucketName();

export { minioClient, BUCKET_NAME, ensureBucketExists, makeBucketPublic, getMinioClientInstance, getBucketName };

