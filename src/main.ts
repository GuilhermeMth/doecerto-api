import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Request, Response } from 'express';

function configureCors(
  app: NestExpressApplication,
  configService: ConfigService,
  logger: Logger,
) {
  const allowedOrigins = [
    configService.get<string>('FRONTEND_URL'),
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost',
    'capacitor://localhost',
  ].filter(Boolean);

  const allowedOriginPatterns = [
    /^exp:\/\/.*$/,
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  ];

  const isAllowedOrigin = (origin: string) =>
    allowedOrigins.includes(origin) ||
    allowedOriginPatterns.some((pattern) => pattern.test(origin));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        isAllowedOrigin(origin) ||
        configService.get('NODE_ENV') === 'development'
      ) {
        callback(null, true);
        return;
      }

      logger.warn(`CORS bloqueado para a origem: ${origin}`);
      callback(new Error('Not allowed by CORS'));
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
    maxAge: 86400,
  });
}

function configureSwagger(app: NestExpressApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('DoeCerto API')
    .setDescription('Documentação da API do DoeCerto')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, swaggerDocument);

  app.use('/api-json', (_req: Request, res: Response) => {
    res.json(swaggerDocument);
  });
}

function configureMiddlewares(app: NestExpressApplication) {
  app.use(cookieParser());
}

function configureStaticAssets(app: NestExpressApplication) {
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
    maxAge: '1d',
  });
}

function configureValidation(app: NestExpressApplication) {
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
}

async function ensureAdminUser(prisma: PrismaService, logger: Logger) {
  const adminEmail = 'admin@example.com';
  const adminPassword =
    '$2b$10$oy5xDYIcNfswR5gQQxtaYedB9/Z1goXvbfGaL3P8rccQSn31gnPt2';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    return;
  }

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    },
  });

  logger.log('Hardcoded admin account created.');
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const prisma = app.get(PrismaService);

  configureCors(app, configService, logger);
  configureMiddlewares(app);
  configureSwagger(app);
  configureStaticAssets(app);
  configureValidation(app);

  const port = configService.get<number>('PORT') || 3501;

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API rodando em: http://localhost:${port}`);

  await ensureAdminUser(prisma, logger);
}

void bootstrap();
