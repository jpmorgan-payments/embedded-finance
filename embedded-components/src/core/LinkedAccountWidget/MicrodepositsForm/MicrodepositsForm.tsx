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
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <DialogContent className="eb-max-h-[min(60rem,100vh)] eb-max-w-[30rem] eb-gap-4 eb-px-0 eb-pb-0">
        <DialogHeader className="eb-px-6">
          <DialogTitle>Verify microdeposits</DialogTitle>
          <DialogDescription>
            Enter the two micro-deposits we sent to your external bank account
            <b> {recipient ? getRecipientLabel(recipient) : '...'} </b>
            in any order. You have three attempts to enter these amounts.
          </DialogDescription>
        </DialogHeader>
        {verifyStatus === 'pending' ? (
          <div className="eb-flex eb-h-[25rem] eb-items-center eb-justify-center eb-border-t-2">
            <Loader2Icon
              className="eb-animate-spin eb-stroke-primary"
              size={48}
            />
          </div>
        ) : verifyStatus === 'success' &&
          verifyResponse.status === 'VERIFIED' ? (
          <div>
            <div className="eb-flex eb-h-80 eb-items-center eb-justify-center eb-border-t-2">
              <div className="eb-grid eb-gap-2 eb-px-10">
                <CheckCircle2Icon
                  className="eb-justify-self-center eb-stroke-green-600"
                  size={72}
                />
                <p className="eb-justify-self-center eb-text-lg eb-font-medium">
                  Success!
                </p>

                <p className="eb-mt-8 eb-text-muted-foreground">
                  You have completed the microdeposits verification. You can now
                  make transactions to your linked account{' '}
                  <b>{recipient ? getRecipientLabel(recipient) : '...'}</b>
                </p>
              </div>
            </div>
            <DialogFooter className="eb-mx-6 eb-my-4 eb-gap-2">
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <ScrollArea className="eb-max-h-[calc(min(60rem,100vh)-5.5rem)] eb-border-t-2">
                <div className="eb-grid eb-gap-2 eb-px-6 eb-pt-4">
                  {verifyResponse?.status === 'FAILED' && (
                    <Alert variant="destructive">
                      <AlertTriangleIcon className="eb-h-4 eb-w-4 eb-stroke-destructive" />
                      <AlertTitle>Verification failed</AlertTitle>
                      <AlertDescription>
                        The microdeposits you have entered were incorrect.
                        Please try again.
                      </AlertDescription>
                    </Alert>
                  )}
                  {verifyResponse?.status ===
                    'FAILED_MAX_ATTEMPTS_EXCEEDED' && (
                    <Alert variant="destructive">
                      <AlertTriangleIcon className="eb-h-4 eb-w-4 eb-stroke-destructive" />
                      <AlertTitle>Max number of attempts exceeded</AlertTitle>
                      <AlertDescription>
                        You have exceeded the maximum number of attempts to
                        verify microdeposits. Please contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="eb-grid eb-grid-flow-col eb-justify-stretch eb-gap-4">
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
                <DialogFooter className="eb-mx-6 eb-my-4 eb-gap-2">
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Verify</Button>
                </DialogFooter>
              </ScrollArea>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
