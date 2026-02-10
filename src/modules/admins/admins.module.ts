import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { OngsModule } from 'src/modules/ongs/ongs.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MetricsService } from 'src/modules/metrics/metrics.service';
import { ConfigModule } from '@nestjs/config'; // Adicionado
import { PrismaService } from 'src/prisma/prisma.service'; // Adicionar esta linha

@Module({
  imports: [OngsModule, PrismaModule, ConfigModule], // Adicionado ConfigModule
  providers: [AdminsService, MetricsService, PrismaService], // Registrar explicitamente o PrismaService
  controllers: [AdminsController],
})
export class AdminsModule {}