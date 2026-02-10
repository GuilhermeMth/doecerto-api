import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers e Services principais
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Módulos de infraestrutura
import { PrismaModule } from './prisma/prisma.module';
import { CacheConfigModule } from './cache/cache.module';

// Módulos de domínio/funcionalidade
import { UsersModule } from './modules/users/users.module';
import { DonorsModule } from './modules/donors/donors.module';
import { OngsModule } from './modules/ongs/ongs.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminsModule } from './modules/admins/admins.module';
import { DonationsModule } from './modules/donations/donations.module';
import { WhishlistItemModule } from './modules/whishlist-items/whishlist-item.module'; // Corrija para WishlistItemModule se necessário
import { OngProfilesModule } from './modules/ong-profile/ong-profiles.module';
import { DonorProfileModule } from './modules/donor-profiles/donor-profiles.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { OngsBankAccountModule } from './modules/ongs-bank-account/ongs-bank-account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : '.env',
      // Pode adicionar validação de schema aqui se desejar
    }),
    PrismaModule,
    CacheConfigModule,

    UsersModule,
    DonorsModule,
    OngsModule,
    AuthModule,
    AdminsModule,
    DonationsModule,
    WhishlistItemModule, // Corrija para WishlistItemModule se necessário
    OngProfilesModule,
    DonorProfileModule,
    RatingsModule,
    CatalogModule,
    CategoriesModule,
    AddressesModule,
    OngsBankAccountModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
