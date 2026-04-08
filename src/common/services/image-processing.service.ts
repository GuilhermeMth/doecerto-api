import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { unlink } from 'fs/promises';

@Injectable()
export class ImageProcessingService {
  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  /**
   * Converte caminho do servidor para caminho público padronizado
   */
  private getPublicPath(filePath: string): string {
    const uploadsIndex = filePath.indexOf('uploads/');
    return uploadsIndex >= 0 ? '/' + filePath.slice(uploadsIndex) : '/' + filePath.replace(/^\.\/?/, '');
  }

  /**
   * Processa imagem para avatar: corta para 1:1, redimensiona e comprime
   */
  async processAvatarImage(filePath: string, size: number = 512): Promise<string> {
    try {
      const outputPath = filePath.replace(
        /\.(jpg|jpeg|png|webp)$/i,
        '-processed.jpg',
      );

      await sharp(filePath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(outputPath);

      await unlink(filePath);

      return this.getPublicPath(outputPath);
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw new Error(`Failed to process image: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Processa imagem para banner: corta para 16:9, redimensiona e comprime
   */
  async processBannerImage(
    filePath: string,
    width: number = 1920,
    crop?: { x: number; y: number },
  ): Promise<string> {
    try {
      const outputPath = filePath.replace(
        /\.(jpg|jpeg|png|webp)$/i,
        '-processed.jpg',
      );

      // Banner em proporção 16:9 (1920x1080)
      const height = Math.round(width * 9 / 16);

      const metadata = await sharp(filePath).metadata();
      const sourceWidth = metadata.width;
      const sourceHeight = metadata.height;

      if (!sourceWidth || !sourceHeight) {
        throw new Error('Invalid source image dimensions');
      }

      const targetAspectRatio = 16 / 9;
      const sourceAspectRatio = sourceWidth / sourceHeight;

      let extractWidth: number;
      let extractHeight: number;

      if (sourceAspectRatio > targetAspectRatio) {
        extractHeight = sourceHeight;
        extractWidth = Math.round(sourceHeight * targetAspectRatio);
      } else {
        extractWidth = sourceWidth;
        extractHeight = Math.round(sourceWidth / targetAspectRatio);
      }

      const focusX = this.clamp((crop?.x ?? 50) / 100, 0, 1);
      const focusY = this.clamp((crop?.y ?? 50) / 100, 0, 1);

      let left = Math.round(focusX * sourceWidth - extractWidth / 2);
      let top = Math.round(focusY * sourceHeight - extractHeight / 2);

      left = this.clamp(left, 0, sourceWidth - extractWidth);
      top = this.clamp(top, 0, sourceHeight - extractHeight);

      await sharp(filePath)
        .extract({
          left,
          top,
          width: extractWidth,
          height: extractHeight,
        })
        .resize(width, height, {
          fit: 'cover',
        })
        .jpeg({
          quality: 85,
          progressive: true,
        })
        .toFile(outputPath);

      await unlink(filePath);

      return this.getPublicPath(outputPath);
    } catch (error) {
      await unlink(filePath).catch(() => {});
      throw new Error(`Failed to process banner image: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Valida se a imagem está na proporção 1:1
   */
  async validateAspectRatio(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        return false;
      }

      const aspectRatio = width / height;
      const tolerance = 0.05;

      return Math.abs(aspectRatio - 1) <= tolerance;
    } catch (error) {
      return false;
    }
  }

  /**
   * Processa comprovante de pagamento (imagem): comprime mantendo proporção
   * PDF não é processado, apenas retorna o caminho
   */
  async processPaymentProof(filePath: string): Promise<string> {
    // Se for PDF, não processa, apenas retorna o caminho
    if (filePath.toLowerCase().endsWith('.pdf')) {
      return filePath;
    }

    try {
      const outputPath = filePath.replace(
        /\.(jpg|jpeg|png)$/i,
        '-processed.jpg',
      );

      // Comprime a imagem mantendo proporção original
      await sharp(filePath)
        .resize(1200, 1200, {
          fit: 'inside', // Mantém proporção, não corta
          withoutEnlargement: true, // Não aumenta se já for menor
        })
        .jpeg({
          quality: 80, // Boa compressão
          progressive: true,
        })
        .toFile(outputPath);

      // Remove arquivo original
      await unlink(filePath);

      return this.getPublicPath(outputPath);
    } catch (error) {
      // Se falhar, remove o arquivo original
      await unlink(filePath).catch(() => {});
      throw new Error(`Failed to process payment proof: ${this.getErrorMessage(error)}`);
    }
  }
}