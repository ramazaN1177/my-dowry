/**
 * Test Script: Test MinIO public URL format and bucket access
 * 
 * This script tests if:
 * 1. Bucket is public
 * 2. Public URLs are correctly formatted
 * 3. Images can be accessed directly via browser
 * 
 * Run: npx ts-node src/scripts/test-minio-public-url.ts
 */

import dotenv from 'dotenv';
import { getMinioClientInstance, getBucketName } from '../config/minio.config';
import { MinioService } from '../services/minio.service';

// Load environment variables
dotenv.config();

async function testMinioPublicUrl() {
  try {
    console.log('🧪 Testing MinIO Public URL Configuration...\n');

    const client = getMinioClientInstance();
    const bucketName = getBucketName();
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';

    console.log('📊 MinIO Configuration:');
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Bucket: ${bucketName}\n`);

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucketName);
    if (!bucketExists) {
      console.log('❌ Bucket does not exist!');
      return;
    }
    console.log('✅ Bucket exists\n');

    // Get bucket policy
    try {
      const policy = await client.getBucketPolicy(bucketName);
      const policyObj = JSON.parse(policy);
      console.log('📋 Bucket Policy:');
      console.log(JSON.stringify(policyObj, null, 2));
      
      const isPublic = policyObj.Statement?.some((stmt: any) => 
        stmt.Effect === 'Allow' && 
        stmt.Principal?.AWS?.includes('*') &&
        stmt.Action?.includes('s3:GetObject')
      );
      
      if (isPublic) {
        console.log('\n✅ Bucket is PUBLIC - images can be accessed directly\n');
      } else {
        console.log('\n⚠️  Bucket is NOT public - images cannot be accessed directly\n');
      }
    } catch (error: any) {
      console.log('⚠️  Could not get bucket policy:', error.message);
      console.log('   Bucket might not be public yet\n');
    }

    // Test public URL format
    const testPath = 'test/sample.jpg';
    const publicUrl = MinioService.getPublicUrl(testPath);
    
    console.log('🔗 Public URL Format:');
    console.log(`   Test Path: ${testPath}`);
    console.log(`   Public URL: ${publicUrl}\n`);

    // Expected format
    const url = new URL(endpoint);
    const expectedUrl = `${url.protocol}//${url.hostname}:${url.port || '9000'}/${bucketName}/${testPath}`;
    
    console.log('📝 Expected URL Format:');
    console.log(`   ${expectedUrl}\n`);

    if (publicUrl === expectedUrl) {
      console.log('✅ URL format is CORRECT\n');
    } else {
      console.log('⚠️  URL format might be incorrect\n');
    }

    // List some objects in bucket
    try {
      const objectsStream = client.listObjects(bucketName, '', true);
      let objectCount = 0;
      const sampleObjects: string[] = [];

      for await (const obj of objectsStream) {
        if (obj.name && objectCount < 5) {
          sampleObjects.push(obj.name);
          objectCount++;
        }
        if (objectCount >= 5) break;
      }

      if (sampleObjects.length > 0) {
        console.log(`📸 Sample Objects in Bucket (${objectCount} shown):`);
        sampleObjects.forEach((objName, index) => {
          const objUrl = MinioService.getPublicUrl(objName);
          console.log(`   ${index + 1}. ${objName}`);
          console.log(`      URL: ${objUrl}`);
        });
        console.log('\n💡 Copy one of these URLs and paste in browser to test direct access\n');
      } else {
        console.log('ℹ️  No objects found in bucket yet\n');
      }
    } catch (error: any) {
      console.log('⚠️  Could not list objects:', error.message);
    }

    console.log('='.repeat(50));
    console.log('✅ Test completed!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testMinioPublicUrl();

