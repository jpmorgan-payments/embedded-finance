import { FC, ReactNode, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { getRecipientLabel } from '@/lib/utils';
import {
  useGetRecipient,
  useRecipientsVerification,
} from '@/api/generated/ef-v1';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

import {
  MicrodepositsFormDataType,
  MicrodepositsFormSchema,
} from './MicrodepositsForm.schema';

type MicrodepositsFormDialogTriggerProps = {
  children: ReactNode;
  recipientId: string;
};

export const MicrodepositsFormDialogTrigger: FC<
  MicrodepositsFormDialogTriggerProps
> = ({ children, recipientId }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { data: recipient } = useGetRecipient(recipientId);

  const form = useForm<MicrodepositsFormDataType>({
    resolver: zodResolver(MicrodepositsFormSchema),
    defaultValues: {
      amount1: 0,
      amount2: 0,
    },
  });

  const {
    mutate: verify,
    reset: resetVerify,
    status: verifyStatus,
    data: verifyResponse,
  } = useRecipientsVerification();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmit = (data: z.infer<typeof MicrodepositsFormSchema>) => {
    // Handle account linking logic here
    verify({
      id: recipientId,
      data: {
        amounts: [data.amount1, data.amount2],
      },
    });
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (open) {
          resetVerify();
          form.reset();
        }
        setDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-scrollable-dialog eb-max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verify Microdeposits</DialogTitle>
          <DialogDescription>
            Enter the two micro-deposits we sent to your external bank account
            <b> {recipient ? getRecipientLabel(recipient) : '...'} </b>
            in any order. You have three attempts to enter these amounts.
          </DialogDescription>
        </DialogHeader>
        {verifyStatus === 'pending' ? (
          <div className="eb-flex eb-h-[25rem] eb-items-center eb-justify-center">
            <Loader2Icon
              className="eb-animate-spin eb-stroke-primary"
              size={48}
            />
          </div>
        ) : verifyStatus === 'success' &&
          verifyResponse.status === 'VERIFIED' ? (
          <div className="eb-space-y-6">
            <div className="eb-flex eb-h-80 eb-items-center eb-justify-center">
              <div className="eb-grid eb-gap-4 eb-text-center">
                <CheckCircle2Icon
                  className="eb-justify-self-center eb-stroke-green-600"
                  size={72}
                />
                <p className="eb-text-lg eb-font-medium">Success!</p>

                <p className="eb-text-muted-foreground">
                  You have completed the microdeposits verification. You can now
                  make transactions to your linked account{' '}
                  <b>{recipient ? getRecipientLabel(recipient) : '...'}</b>
                </p>
              </div>
            </div>
            <DialogFooter className="eb-gap-2">
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <div className="eb-scrollable-content">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="eb-space-y-6"
              >
                {/* Error Alerts */}
                {verifyResponse?.status === 'FAILED' && (
                  <Alert variant="destructive">
                    <AlertTriangleIcon className="eb-h-4 eb-w-4" />
                    <AlertTitle>Verification failed</AlertTitle>
                    <AlertDescription>
                      The microdeposits you have entered were incorrect. Please
                      try again.
                    </AlertDescription>
                  </Alert>
                )}
                {verifyResponse?.status === 'FAILED_MAX_ATTEMPTS_EXCEEDED' && (
                  <Alert variant="destructive">
                    <AlertTriangleIcon className="eb-h-4 eb-w-4" />
                    <AlertTitle>Max number of attempts exceeded</AlertTitle>
                    <AlertDescription>
                      You have exceeded the maximum number of attempts to verify
                      microdeposits. Please contact support.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Microdeposit Amounts Section */}
                <div className="eb-space-y-4">
                  <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                    <FormField
                      control={form.control}
                      name="amount1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Microdeposit Amount 1</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step={0.01}
                              placeholder="0.00"
                              min={0}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Microdeposit Amount 2</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step={0.01}
                              placeholder="0.00"
                              min={0}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="eb-gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Verify</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
