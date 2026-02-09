import { Controller, Get, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { GetCatalogDto } from './dto/get-catalog.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import type { User } from 'generated/prisma';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  )
  async getCatalog(@Query() filters: GetCatalogDto, @CurrentUser() user: User) {
    return this.catalogService.getCatalog(filters, user.id);
  }
}
