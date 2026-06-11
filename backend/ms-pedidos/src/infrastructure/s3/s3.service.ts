import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly storageType: string;

  constructor(private readonly configService: ConfigService) {
    this.storageType = this.configService.get<string>(
      'aws.storageType',
      'local',
    );
    this.bucketName = this.configService.get<string>(
      'aws.s3BucketName',
      'polloscarmesi-delivery-evidence',
    );

    if (this.storageType === 's3') {
      const region = this.configService.get<string>('aws.region');
      const accessKeyId = this.configService.get<string>('aws.accessKeyId');
      const secretAccessKey = this.configService.get<string>(
        'aws.secretAccessKey',
      );
      const endpointUrl = this.configService.get<string>('aws.endpointUrl');

      if (accessKeyId && secretAccessKey) {
        const clientConfig: any = {
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        };

        if (endpointUrl) {
          clientConfig.endpoint = endpointUrl;
          clientConfig.forcePathStyle = true;
          this.logger.log(`Using custom S3 endpoint: ${endpointUrl}`);
        }

        this.s3Client = new S3Client(clientConfig);
        this.logger.log('S3 Client initialized successfully');
      } else {
        this.logger.warn(
          'S3 Storage active but credentials are empty. S3 calls will fail.',
        );
      }
    } else {
      this.logger.log('S3 Storage running in LOCAL fallback mode.');
    }
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    if (this.storageType === 's3' && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          }),
        );
        this.logger.log(`Uploaded file to S3: ${key}`);
        const endpointUrl = this.configService.get<string>('aws.endpointUrl');
        if (endpointUrl) {
          return `${endpointUrl}/${this.bucketName}/${key}`;
        }
        return `https://${this.bucketName}.s3.${this.configService.get<string>('aws.region')}.amazonaws.com/${key}`;
      } catch (err) {
        this.logger.error(`Error uploading to S3: ${err.message}`);
        throw err;
      }
    } else {
      // Local fallback
      try {
        const uploadDir = path.resolve(process.cwd(), 'uploads');
        const targetPath = path.join(uploadDir, key);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, buffer);

        this.logger.log(`Saved file locally to: ${targetPath}`);
        // Return local accessible URL
        const port = this.configService.get<number>('port', 3001);
        return `http://localhost:${port}/uploads/${key}`;
      } catch (err) {
        this.logger.error(`Error saving file locally: ${err.message}`);
        throw err;
      }
    }
  }

  async deleteFile(fileUrl: string, key?: string): Promise<void> {
    const objectKey = key || this.extractKeyFromUrl(fileUrl);
    if (!objectKey) return;

    if (this.storageType === 's3' && this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
          }),
        );
        this.logger.log(`Deleted file from S3: ${objectKey}`);
      } catch (err) {
        this.logger.error(`Error deleting from S3: ${err.message}`);
      }
    } else {
      try {
        const uploadDir = path.resolve(process.cwd(), 'uploads');
        const targetPath = path.join(uploadDir, objectKey);
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
          this.logger.log(`Deleted local file: ${targetPath}`);
        }
      } catch (err) {
        this.logger.error(`Error deleting local file: ${err.message}`);
      }
    }
  }

  private extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    try {
      if (url.includes('.amazonaws.com/')) {
        return url.split('.amazonaws.com/')[1];
      }
      if (url.includes('/uploads/')) {
        return url.split('/uploads/')[1];
      }
      return null;
    } catch {
      return null;
    }
  }
}
