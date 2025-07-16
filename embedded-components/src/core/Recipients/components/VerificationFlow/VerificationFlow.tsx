import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
// Icons
import { AlertTriangle, CheckCircle, DollarSign, Info } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useRecipientsVerification } from '@/api/generated/ep-recipients';
import type {
  MicrodepositAmounts,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Validation schema
const verificationSchema = z.object({
  amount1: z.number().min(0.01).max(0.99),
  amount2: z.number().min(0.01).max(0.99),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

export interface VerificationFlowProps {
  recipient: Recipient;
  onComplete: (recipient: Recipient) => void;
  onCancel: () => void;
}

export const VerificationFlow: React.FC<VerificationFlowProps> = ({
  recipient,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<
    'instructions' | 'amounts' | 'result'
  >('instructions');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'VERIFIED' | 'FAILED' | 'FAILED_MAX_ATTEMPTS_EXCEEDED';
    message?: string;
    success?: boolean;
    attemptsRemaining?: number;
  } | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      amount1: 0,
      amount2: 0,
    },
  });

  const verificationMutation = useRecipientsVerification({
    mutation: {
      onSuccess: (data) => {
        setVerificationResult({
          status: data.status,
          message: getStatusMessage(data.status),
          success: data.status === 'VERIFIED',
          attemptsRemaining: data.attemptsRemaining,
        });
        setCurrentStep('result');

        if (data.status === 'VERIFIED') {
          // Update recipient status and call onComplete
          const updatedRecipient = { ...recipient, status: 'ACTIVE' as const };
          onComplete(updatedRecipient);
        }
      },
      onError: (error) => {
        console.error('Verification failed:', error);
        setVerificationResult({
          status: 'FAILED',
          message: 'Verification failed. Please try again.',
          success: false,
          attemptsRemaining: 0, // No attempts remaining on error
        });
        setCurrentStep('result');
      },
    },
  });

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'VERIFIED':
        return 'Microdeposits verified successfully! The recipient is now active.';
      case 'FAILED':
        return 'The amounts you entered do not match. Please check and try again.';
      case 'FAILED_MAX_ATTEMPTS_EXCEEDED':
        return 'Maximum verification attempts exceeded. Please contact support.';
      default:
        return 'Unknown verification status.';
    }
  };

  const onSubmit = (data: VerificationFormData) => {
    const microdepositData: MicrodepositAmounts = {
      amounts: [data.amount1, data.amount2],
    };

    verificationMutation.mutate({
      id: recipient.id,
      data: microdepositData,
    });
  };

  if (currentStep === 'instructions') {
    return (
      <div className="eb-space-y-6 eb-pb-4">
        <Card>
          <CardHeader>
            <CardTitle className="eb-flex eb-items-center eb-gap-2">
              <DollarSign className="eb-h-5 eb-w-5" />
              Microdeposit Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4">
            <Alert>
              <Info className="eb-h-4 eb-w-4" />
              <AlertDescription>
                Microdeposits have been initiated to your account. Please check
                your bank statement for the deposit amounts.
              </AlertDescription>
            </Alert>

            <div className="eb-space-y-3">
              <h3 className="eb-font-medium">Instructions:</h3>
              <ul className="eb-list-inside eb-list-disc eb-space-y-1 eb-text-sm eb-text-gray-600">
                <li>
                  Two small deposits (typically less than $1.00 each) will
                  appear in your account within 1-2 business days
                </li>
                <li>
                  The deposits will show as &quot;VERIFICATION&quot; or similar
                  on your statement
                </li>
                <li>
                  Once you see the deposits, return here and enter the exact
                  amounts
                </li>
                <li>The amounts must be entered in cents (e.g., $0.23 = 23)</li>
                <li>You have 3 attempts to enter the correct amounts</li>
              </ul>
            </div>

            <div className="eb-rounded-lg eb-bg-gray-50 eb-p-4">
              <h4 className="eb-mb-2 eb-font-medium">Recipient Information:</h4>
              <div className="eb-grid eb-grid-cols-2 eb-gap-4 eb-text-sm">
                <div>
                  <span className="eb-text-gray-600">Name:</span>
                  <p className="eb-font-medium">
                    {recipient.partyDetails.type === 'INDIVIDUAL'
                      ? `${recipient.partyDetails.firstName} ${recipient.partyDetails.lastName}`
                      : recipient.partyDetails.businessName}
                  </p>
                </div>
                <div>
                  <span className="eb-text-gray-600">Account:</span>
                  <p className="eb-font-mono">
                    ****{recipient.account?.number?.slice(-4)}
                  </p>
                </div>
                <div>
                  <span className="eb-text-gray-600">Status:</span>
                  <Badge
                    variant="secondary"
                    className="eb-bg-blue-50 eb-text-blue-700"
                  >
                    {recipient.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="eb-flex eb-justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => setCurrentStep('amounts')}>
            I See the Deposits
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'amounts') {
    return (
      <div className="eb-space-y-6 eb-pb-4">
        <Card>
          <CardHeader>
            <CardTitle className="eb-flex eb-items-center eb-gap-2">
              <DollarSign className="eb-h-5 eb-w-5" />
              Enter Microdeposit Amounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="eb-space-y-4">
              <Alert>
                <Info className="eb-h-4 eb-w-4" />
                <AlertDescription>
                  Enter the exact amounts of the two microdeposits you received.
                  Amounts should be in cents (e.g., $0.23 = 23).
                </AlertDescription>
              </Alert>

              <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                <div className="eb-space-y-2">
                  <Label htmlFor="amount1">First Deposit Amount (cents)</Label>
                  <div className="eb-relative">
                    <DollarSign className="eb-absolute eb-left-3 eb-top-1/2 eb-h-4 eb-w-4 eb--translate-y-1/2 eb-transform eb-text-gray-400" />
                    <Controller
                      name="amount1"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="23"
                          className="eb-pl-10"
                          min="1"
                          max="99"
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.amount1 && (
                      <p className="eb-text-sm eb-text-red-500">
                        {errors.amount1.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="eb-space-y-2">
                  <Label htmlFor="amount2">Second Deposit Amount (cents)</Label>
                  <div className="eb-relative">
                    <DollarSign className="eb-absolute eb-left-3 eb-top-1/2 eb-h-4 eb-w-4 eb--translate-y-1/2 eb-transform eb-text-gray-400" />
                    <Controller
                      name="amount2"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="47"
                          className="eb-pl-10"
                          min="1"
                          max="99"
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      )}
                    />
                    {errors.amount2 && (
                      <p className="eb-text-sm eb-text-red-500">
                        {errors.amount2.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {verificationMutation.isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="eb-h-4 eb-w-4" />
                  <AlertDescription>
                    {verificationMutation.error.message ||
                      'Failed to verify deposits'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="eb-flex eb-justify-between eb-pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('instructions')}
                >
                  Back
                </Button>
                <div className="eb-flex eb-gap-2">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={verificationMutation.isPending}
                  >
                    {verificationMutation.isPending
                      ? 'Verifying...'
                      : 'Verify Deposits'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Verification result
  return (
    <div className="eb-space-y-6 eb-pb-4">
      <Card>
        <CardHeader>
          <CardTitle className="eb-flex eb-items-center eb-gap-2">
            {verificationResult?.success ? (
              <CheckCircle className="eb-h-5 eb-w-5 eb-text-green-600" />
            ) : (
              <AlertTriangle className="eb-h-5 eb-w-5 eb-text-red-600" />
            )}
            Verification Result
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-space-y-4">
          {verificationResult?.success ? (
            <>
              <Alert>
                <CheckCircle className="eb-h-4 eb-w-4" />
                <AlertDescription>
                  Microdeposit verification successful! Your account has been
                  verified.
                </AlertDescription>
              </Alert>

              <div className="eb-rounded-lg eb-bg-green-50 eb-p-4">
                <h4 className="eb-mb-2 eb-font-medium eb-text-green-800">
                  Success!
                </h4>
                <p className="eb-text-sm eb-text-green-700">
                  Your recipient account has been successfully verified and is
                  now ready for transactions.
                </p>
              </div>
            </>
          ) : (
            <>
              {verificationResult?.attemptsRemaining &&
              verificationResult.attemptsRemaining > 0 ? (
                <div className="eb-rounded-lg eb-bg-red-50 eb-p-4">
                  <h4 className="eb-mb-2 eb-font-medium eb-text-red-800">
                    Verification Failed
                  </h4>
                  <p className="eb-text-sm eb-text-red-700">
                    The amounts you entered don&apos;t match our records. You
                    have {verificationResult.attemptsRemaining} attempts
                    remaining.
                  </p>
                </div>
              ) : (
                <div className="eb-rounded-lg eb-bg-red-50 eb-p-4">
                  <h4 className="eb-mb-2 eb-font-medium eb-text-red-800">
                    Verification Failed
                  </h4>
                  <p className="eb-text-sm eb-text-red-700">
                    Maximum verification attempts exceeded. Please contact
                    support for assistance.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="eb-flex eb-justify-between">
        {verificationResult?.success ? (
          <Button onClick={() => onComplete(recipient)} className="eb-ml-auto">
            Complete
          </Button>
        ) : verificationResult?.attemptsRemaining &&
          verificationResult.attemptsRemaining > 0 ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep('amounts')}
            >
              Try Again
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={onCancel} className="eb-ml-auto">
            Close
          </Button>
        )}
      </div>
    </div>
  );
};
