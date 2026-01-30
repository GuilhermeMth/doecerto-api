import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma'; // use '@prisma/client' se não alterou o output

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Skip database connection in test mode
    if (process.env.NODE_ENV === 'test') {
      console.log('[PrismaService] Skipping database connection in TEST mode');
      return;
    }
    await this.$connect();
  }
}
