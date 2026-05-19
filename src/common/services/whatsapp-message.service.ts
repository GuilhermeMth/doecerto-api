import { Injectable } from '@nestjs/common';

@Injectable()
export class WhatsappMessageService {
  private readonly whatsappApiUrl = 'https://api.whatsapp.com/send';

  /**
   * Gera a mensagem simples para doação
   * @param userName Nome do usuário que está doando
   * @param donationId ID da doação
   * @param description Descrição do item sendo doado
   * @param quantity Quantidade de unidades
   * @returns Mensagem formatada para WhatsApp
   */
  generateDonationMessage(
    userName: string,
    donationId: number,
    description: string,
    quantity: number,
  ): string {
    return `Olá, meu nome é ${userName}, o id da minha doação é ${donationId} e gostaria de doar ${description} na quantidade de ${quantity} unidades`;
  }

  /**
   * Gera um link para enviar uma mensagem via WhatsApp
   * @param phoneNumber Número de telefone no formato internacional (ex: +5511999999999)
   * @param message Mensagem a ser enviada
   * @returns URL para enviar a mensagem via WhatsApp
   */
  generateWhatsappLink(phoneNumber: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `${this.whatsappApiUrl}?phone=${phoneNumber}&text=${encodedMessage}`;
  }
}
