import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '',
});

export interface CreateOrderParams {
  amount: number; // in paise (INR)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface PaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class RazorpayService {
  async createOrder(params: CreateOrderParams) {
    try {
      const options = {
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: params.receipt || `receipt_${Date.now()}`,
        notes: params.notes || {},
      };

      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  verifyPaymentSignature(verification: PaymentVerification): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verification;
      
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

      return expectedSignature === razorpay_signature;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async capturePayment(paymentId: string, amount: number) {
    try {
      const payment = await razorpay.payments.capture(paymentId, amount);
      return payment;
    } catch (error) {
      console.error('Payment capture failed:', error);
      throw new Error('Failed to capture payment');
    }
  }

  async refundPayment(paymentId: string, amount?: number) {
    try {
      const refundData: any = { payment_id: paymentId };
      if (amount) {
        refundData.amount = amount;
      }

      const refund = await razorpay.payments.refund(paymentId, refundData);
      return refund;
    } catch (error) {
      console.error('Payment refund failed:', error);
      throw new Error('Failed to refund payment');
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      throw new Error('Failed to get payment details');
    }
  }
}

export const razorpayService = new RazorpayService();
