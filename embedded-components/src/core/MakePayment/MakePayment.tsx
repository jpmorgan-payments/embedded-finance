'use client';

import type React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { usePaymentForm } from './usePaymentForm';

interface Account {
  id: string;
  name: string;
}

interface Recipient {
  id: string;
  name: string;
  accountNumber: string;
}

interface PaymentComponentProps {
  triggerButton?: React.ReactNode;
}

export const MakePayment: React.FC<PaymentComponentProps> = ({
  triggerButton,
}) => {
  const {
    form,
    onSubmit,
    isLoading,
    isSuccess,
    accounts,
    recipients,
    resetForm,
  } = usePaymentForm();
  const [showAd, setShowAd] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleConfirm = form.handleSubmit(onSubmit);

  const amount = Number.parseFloat(form.watch('amount') || '0');
  const from = form.watch('from');
  const to = form.watch('to');
  const method = form.watch('method');
  const isFormFilled = amount > 0 && from && to && method;

  const getFee = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'WIRE':
        return 25;
      case 'ACH':
        return 2.5;
      case 'RTP':
        return 1;
      default:
        return 0;
    }
  };

  const fee = getFee(method);
  const isAmountValid = amount > fee;

  const handleMakeAnotherPayment = () => {
    resetForm();
    setDialogOpen(true);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button onClick={() => setDialogOpen(true)}>Make a Payment</Button>
        )}
      </DialogTrigger>
      <DialogContent className="eb-sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make a Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details below.
          </DialogDescription>
        </DialogHeader>

        {!isSuccess && showAd && (
          <Alert
            variant="default"
            className="eb-mb-4 eb-border-blue-200 eb-bg-blue-50"
          >
            <Info className="eb-h-4 eb-w-4 eb-mt-2 eb-text-blue-500" />
            <AlertDescription className="eb-flex eb-items-center eb-justify-between eb-text-blue-700">
              <span>
                Try our new payout capability for faster transactions!
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAd(false)}
                className="eb-text-blue-700 hover:eb-text-blue-900"
              >
                <X className="eb-h-4 eb-w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isSuccess ? (
          <div className="eb-rounded-lg eb-bg-gray-200 eb-p-6 eb-text-center">
            <h2 className="eb-mb-4 eb-text-2xl eb-font-bold eb-text-gray-700">
              Payment Successful!
            </h2>
            <p className="eb-text-gray-600">
              Your payment has been processed successfully.
            </p>
            <Button className="eb-mt-4" onClick={handleMakeAnotherPayment}>
              Make Another Payment
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={handleConfirm} className="eb-space-y-4">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Account</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account: Account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Recipient</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recipients.map((recipient: Recipient) => (
                          <SelectItem key={recipient.id} value={recipient.id}>
                            {recipient.name} - {recipient.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <div className="eb-relative">
                        <span className="eb-absolute eb-left-3 eb-mt-2.5 eb-text-gray-500">
                          $
                        </span>
                        <Input
                          {...field}
                          className="eb-pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="eb-flex eb-flex-col eb-space-y-1"
                      >
                        <div className="eb-flex eb-items-center eb-space-x-2">
                          <RadioGroupItem value="ACH" id="ach" />
                          <Label htmlFor="ach">ACH</Label>
                        </div>
                        <div className="eb-flex eb-items-center eb-space-x-2">
                          <RadioGroupItem value="RTP" id="rtp" />
                          <Label htmlFor="rtp">RTP</Label>
                        </div>
                        <div className="eb-flex eb-items-center eb-space-x-2">
                          <RadioGroupItem value="WIRE" id="wire" />
                          <Label htmlFor="wire">WIRE</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isFormFilled && (
                <Collapsible
                  open={isOpen}
                  onOpenChange={setIsOpen}
                  className="eb-w-full eb-space-y-2"
                >
                  <div className="eb-flex eb-items-center eb-justify-between eb-space-x-4 eb-px-4">
                    <h4 className="eb-text-sm eb-font-semibold">
                      Transfer fee: ${fee.toFixed(2)}
                    </h4>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="eb-w-9 eb-p-0"
                        onClick={(e) => e.preventDefault()}
                      >
                        {isOpen ? (
                          <ChevronUp className="eb-h-4 eb-w-4" />
                        ) : (
                          <ChevronDown className="eb-h-4 eb-w-4" />
                        )}
                        <span className="eb-sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="eb-space-y-2">
                    <div className="eb-font-mono eb-rounded-md eb-border eb-px-4 eb-py-3 eb-text-sm">
                      {method === 'WIRE' &&
                        'Domestic wire transfer (outgoing): $25.00'}
                      {method === 'ACH' && 'ACH transfer fee: $2.50'}
                      {method === 'RTP' && 'Real-time payment (RTP) fee: $1.00'}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              {isFormFilled && (
                <div className="eb-text-sm eb-font-medium">
                  Recipient gets: ${(amount - fee).toFixed(2)}
                </div>
              )}
              {!isAmountValid && amount > 0 && (
                <div className="eb-text-sm eb-text-red-500">
                  The amount must be greater than the transfer fee.
                </div>
              )}
              <Button
                type="submit"
                className="eb-w-full"
                disabled={isLoading || !isFormFilled || !isAmountValid}
              >
                {isLoading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
