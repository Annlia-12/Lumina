import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, RAZORPAY_OPTIONS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Shield, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be at least ₹1"),
  recipientId: z.string().min(1, "Recipient is required"),
  donationId: z.string().optional(),
  requestId: z.string().optional(),
  message: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  recipientId: string;
  recipientName: string;
  donationId?: string;
  requestId?: string;
  suggestedAmount?: number;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

// Razorpay integration
declare global {
  interface Window {
    Razorpay?: any;
  }
}

// Load Razorpay script
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function PaymentForm({ 
  recipientId, 
  recipientName, 
  donationId, 
  requestId, 
  suggestedAmount = 100,
  onSuccess,
  onCancel 
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { toast } = useToast();

  // Load Razorpay script on component mount
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(loaded);
    });
  }, []);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: suggestedAmount,
      recipientId,
      donationId,
      requestId,
      message: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", `${API_ENDPOINTS.PAYMENTS}/create-order`, {
        amount: data.amount,
        donationId: data.donationId,
        requestId: data.requestId,
      });
      return response.json();
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await apiRequest("POST", `${API_ENDPOINTS.PAYMENTS}/verify`, paymentData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful! 🎉",
        description: "Your donation has been processed successfully.",
      });
      onSuccess?.(data.payment.id);
    },
    onError: (error) => {
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePayment = async (data: PaymentFormData) => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');

      // Create order
      const order = await createOrderMutation.mutateAsync(data);

      if (!razorpayLoaded || !window.Razorpay) {
        throw new Error('Razorpay not loaded');
      }

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag', // Replace with your key
        amount: data.amount * 100, // Convert to paise
        currency: 'INR',
        name: 'LuminaConnect',
        description: `Donation to ${recipientName}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const paymentData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: data.amount,
              recipientId: data.recipientId,
              donationId: data.donationId,
              requestId: data.requestId,
            };

            await verifyPaymentMutation.mutateAsync(paymentData);
            setPaymentStatus('success');
          } catch (error) {
            setPaymentStatus('failed');
            toast({
              title: "Payment Verification Failed",
              description: "There was an issue verifying your payment. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: 'Donor',
          email: 'donor@example.com',
          contact: '+91-9876543210',
        },
        notes: {
          donationId: data.donationId || '',
          requestId: data.requestId || '',
          message: data.message || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStatus('idle');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setPaymentStatus('failed');
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const predefinedAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="w-full max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center space-x-2 text-lg">
            <CreditCard className="text-primary" size={20} />
            <span>Secure Donation</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Donating to <span className="font-semibold">{recipientName}</span>
          </p>
        </CardHeader>

        <CardContent className="pb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Donation Amount (₹)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="payment-input text-lg font-semibold"
                          data-testid="input-payment-amount"
                        />
                        
                        <div className="grid grid-cols-3 gap-1">
                          {predefinedAmounts.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(amount)}
                              className="text-xs py-1"
                              data-testid={`button-amount-${amount}`}
                            >
                              ₹{amount}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share a message of support..."
                        {...field}
                        rows={3}
                        data-testid="textarea-payment-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                {/* Payment Status */}
                {paymentStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-green-800 font-medium">Payment Successful!</span>
                  </motion.div>
                )}

                {paymentStatus === 'failed' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertCircle className="text-red-600" size={20} />
                    <span className="text-red-800 font-medium">Payment Failed</span>
                  </motion.div>
                )}

                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Shield size={16} />
                  <span>Secured by Razorpay</span>
                  <Lock size={16} />
                </div>

                <div className="flex space-x-3">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="flex-1"
                      disabled={isProcessing}
                      data-testid="button-payment-cancel"
                    >
                      Cancel
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isProcessing || createOrderMutation.isPending || verifyPaymentMutation.isPending || !razorpayLoaded}
                    data-testid="button-payment-submit"
                  >
                    {isProcessing ? (
                      <span className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Processing...</span>
                      </span>
                    ) : !razorpayLoaded ? (
                      "Loading Payment..."
                    ) : (
                      `Donate ₹${form.watch('amount') || 0}`
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
