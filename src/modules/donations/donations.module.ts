import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImageProcessingService } from 'src/common/services/image-processing.service'; // ✅ Importar
import { WhatsappMessageService } from 'src/common/services/whatsapp-message.service';

@Module({
  imports: [PrismaModule],
  controllers: [DonationsController],
  providers: [
    DonationsService,
    ImageProcessingService, // ✅ Registrar aqui
    WhatsappMessageService,
  ],
  exports: [DonationsService],
})
export class DonationsModule {}
