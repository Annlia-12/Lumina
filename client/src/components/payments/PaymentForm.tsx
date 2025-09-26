import { useState } from "react";
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
import { CreditCard, Shield, Lock } from "lucide-react";
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

// Mock Razorpay integration
declare global {
  interface Window {
    Razorpay?: any;
  }
}

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
  const { toast } = useToast();

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

      // Create order
      const order = await createOrderMutation.mutateAsync(data);

      // Mock Razorpay integration
      if (typeof window !== "undefined") {
        // In a real implementation, this would use actual Razorpay
        const mockPaymentSuccess = () => {
          const mockPaymentData = {
            razorpay_order_id: order.id,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: `mock_signature_${Date.now()}`,
            amount: data.amount,
            recipientId: data.recipientId,
            donationId: data.donationId,
            requestId: data.requestId,
          };

          verifyPaymentMutation.mutate(mockPaymentData);
        };

        // Simulate payment processing
        setTimeout(mockPaymentSuccess, 2000);
      }
    } catch (error) {
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
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <CreditCard className="text-primary" size={24} />
            <span>Secure Donation</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Donating to <span className="font-semibold">{recipientName}</span>
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-6">
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
                        
                        <div className="grid grid-cols-3 gap-2">
                          {predefinedAmounts.map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(amount)}
                              className="text-sm"
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
                    disabled={isProcessing || createOrderMutation.isPending || verifyPaymentMutation.isPending}
                    data-testid="button-payment-submit"
                  >
                    {isProcessing ? (
                      <span className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Processing...</span>
                      </span>
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
