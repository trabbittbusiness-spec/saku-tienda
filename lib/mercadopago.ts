import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

// MERCADO PAGO CONFIGURATION
const MP_PUBLIC_KEY = process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || "APP_USR-63c4a71c-20bc-4b78-9427-a388170d9117";

export interface CardData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType?: string;
  identificationNumber?: string;
}

export interface PaymentData {
  transaction_amount: number;
  token?: string;
  description: string;
  installments: number;
  payment_method_id: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

class MercadoPagoService {
  /**
   * Generates a single-use card token using Mercado Pago API.
   * This should be done on the frontend to stay PCI compliant.
   */
  async createCardToken(cardData: CardData): Promise<string> {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_number: cardData.cardNumber.replace(/\s/g, ''),
          expiration_month: parseInt(cardData.cardExpirationMonth),
          expiration_year: parseInt(cardData.cardExpirationYear.length === 2 ? `20${cardData.cardExpirationYear}` : cardData.cardExpirationYear),
          security_code: cardData.securityCode,
          cardholder: {
            name: cardData.cardholderName,
            identification: cardData.identificationType ? {
              type: cardData.identificationType,
              number: cardData.identificationNumber
            } : undefined
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al tokenizar la tarjeta');
      }

      return {
        id: data.id,
        payment_method_id: data.payment_method_id
      };
    } catch (error: any) {
      console.error('MercadoPago Tokenization Error:', error);
      throw error;
    }
  }

  /**
   * Generates a token from a saved card ID and security code.
   */
  async createCardTokenFromSaved(cardId: string, securityCode: string): Promise<any> {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_id: cardId,
          security_code: securityCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al tokenizar la tarjeta guardada');
      }

      return data;
    } catch (error: any) {
      console.error('MercadoPago Saved Tokenization Error:', error);
      throw error;
    }
  }

  /**
   * Processes a payment by calling a Firebase Cloud Function.
   * We do this on the backend to keep the Access Token secure.
   */
  async processPayment(paymentData: any) {
    try {
      const processPaymentFn = httpsCallable(functions, 'processPayment');
      const result = await processPaymentFn(paymentData);
      return result.data;
    } catch (error: any) {
      console.error('Payment Processing Error:', error);
      throw error;
    }
  }

  /**
   * Saves a card for a customer by calling a Firebase Cloud Function.
   */
  async saveCard(cardToken: string, userEmail: string) {
    try {
      const saveCardFn = httpsCallable(functions, 'saveCardToCustomer');
      const result = await saveCardFn({ cardToken, email: userEmail });
      return result.data;
    } catch (error: any) {
      console.error('Save Card Error:', error);
      throw error;
    }
  }

  /**
   * Gets saved cards for a user.
   */
  async getCustomerCards(customerEmail: string) {
    try {
      const getCardsFn = httpsCallable(functions, 'getCustomerCards');
      const result = await getCardsFn({ email: customerEmail });
      return result.data;
    } catch (error: any) {
      console.error('Get Cards Error:', error);
      return []; // Return empty list instead of throwing to prevent UI crash
    }
  }

  /**
   * Helper to identify card brand (Visa, Mastercard, etc.)
   */
  async getIssuers(paymentMethodId: string, bin: string) {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payment_methods/card_issuers?public_key=${MP_PUBLIC_KEY}&payment_method_id=${paymentMethodId}&bin=${bin}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching issuers:', error);
      return [];
    }
  }

  async getPaymentMethod(bin: string) {
    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payment_methods/search?public_key=${MP_PUBLIC_KEY}&bins=${bin}`);
      const data = await response.json();
      return data.results?.[0];
    } catch (error) {
      console.error('Error identifying card brand:', error);
      return null;
    }
  }
}

export const mpService = new MercadoPagoService();
