import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // ============================================
  // CONFIGURAÇÃO DE CORS PARA WEB E MOBILE (CAPACITOR)
  // ============================================
  const allowedOrigins = [
    configService.get<string>('FRONTEND_URL'), // https://doecerto.eastus2.cloudapp.azure.com
    'http://localhost:3000',                  // Web Local
    'http://localhost',                       // Capacitor Android (Padrão)
    'capacitor://localhost',                  // Capacitor iOS (Padrão)
    'http://localhost:19006',                 // Expo Web
    /^exp:\/\/.*$/,                           // Expo Go
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,      // Rede Local (Dev)
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,       // Rede Local (Dev)
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // 1. Permitir requisições sem origin (comum em apps mobile nativos/testes Postman)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Verificar se a origem está na lista permitida
      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed || configService.get('NODE_ENV') === 'development') {
        callback(null, true);
      } else {
        logger.warn(`🚫 CORS bloqueado para a origem: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400, // Cache de preflight por 24 horas
  });

  // Middleware para Cookies
  app.use(cookieParser());

  // Servir arquivos estáticos (Uploads)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    maxAge: '1d',
  });

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuração de Porta e Bind
  const port = configService.get<number>('PORT') || 3501;
  
  // O bind '0.0.0.0' é essencial para o Azure e para acesso via IP na rede local
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API rodando em: http://localhost:${port}`);
  logger.log(`🌐 Ambiente: ${configService.get('NODE_ENV') || 'production'}`);
  logger.log(`📱 Suporte para Capacitor (Android/iOS) e Web Azure habilitado`);
}

void bootstrap();