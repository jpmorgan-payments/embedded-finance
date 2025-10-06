import { FC, ReactNode, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  useCreateRecipient,
  useGetAllRecipients,
} from '@/api/generated/ep-recipients';
import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui';

import { LinkAccountConfirmation } from './LinkAccountConfirmation';
import {
  LinkAccountFormDataType,
  LinkAccountFormSchema,
} from './LinkAccountForm.schema';

type LinkAccountFormDialogTriggerProps = {
  children: ReactNode;
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
};

export const LinkAccountFormDialogTrigger: FC<
  LinkAccountFormDialogTriggerProps
> = ({ children, onLinkedAccountSettled }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState('INDIVIDUAL'); // Default to INDIVIDUAL

  const form = useForm<LinkAccountFormDataType>({
    resolver: zodResolver(LinkAccountFormSchema),
    defaultValues: {
      accountType: 'INDIVIDUAL',
      firstName: '',
      lastName: '',
      routingNumber: '',
      accountNumber: '',
      certify: false,
    },
  });

  const handleAccountTypeChange = (accountType: string) => {
    setSelectedAccountType(accountType);
  };

  const {
    mutate: createRecipient,
    reset: resetCreateRecipient,
    status: createRecipientStatus,
    data: createRecipientResponse,
  } = useCreateRecipient();

  const { refetch: refetchCreateRecipient } = useGetAllRecipients();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmit = (data: z.infer<typeof LinkAccountFormSchema>) => {
    // Handle account linking logic here
    createRecipient(
      {
        data: {
          type: 'LINKED_ACCOUNT',
          partyDetails: {
            type: data.accountType,
            ...(data.accountType === 'INDIVIDUAL'
              ? {
                  firstName: data.firstName,
                  lastName: data.lastName,
                }
              : {
                  businessName: data.businessName,
                }),
          },
          account: {
            type: 'CHECKING',
            number: data.accountNumber,
            routingInformation: [
              {
                routingCodeType: 'USABA',
                routingNumber: data.routingNumber,
                transactionType: 'ACH',
              },
            ],
            countryCode: 'US',
          },
        },
      },
      {
        onSuccess: (response) => {
          refetchCreateRecipient();
          onLinkedAccountSettled?.(response);
        },
        onError: (error) => {
          const apiError = error.response?.data as ApiError;
          onLinkedAccountSettled?.(undefined, apiError);
        },
      }
    );
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (open) {
          resetCreateRecipient();
          form.reset();
        }
        setDialogOpen(open);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-scrollable-dialog eb-max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {createRecipientStatus === 'success'
              ? 'Account linked'
              : 'Link an Account'}
          </DialogTitle>
          <DialogDescription>
            {createRecipientStatus === 'success'
              ? createRecipientResponse?.status === 'MICRODEPOSITS_INITIATED'
                ? 'We initiated microdeposits to verify this account. This usually takes 1–2 business days.'
                : createRecipientResponse?.status === 'READY_FOR_VALIDATION'
                  ? 'Your microdeposits are ready to be verified. Please enter the amounts to complete verification.'
                  : createRecipientResponse?.status === 'ACTIVE'
                    ? 'Your external account has been linked and is active.'
                    : createRecipientResponse?.status === 'PENDING'
                      ? 'We are processing your account. This may take a moment.'
                      : createRecipientResponse?.status === 'INACTIVE'
                        ? 'The account was linked but is currently inactive.'
                        : createRecipientResponse?.status === 'REJECTED'
                          ? 'We could not link this account. Please review details or try again.'
                          : 'Your external account has been linked.'
              : "Enter your external account's information to link it"}
          </DialogDescription>
        </DialogHeader>
        {createRecipientStatus === 'pending' ? (
          <div className="eb-flex eb-h-[25rem] eb-items-center eb-justify-center">
            <Loader2Icon
              className="eb-animate-spin eb-stroke-primary"
              size={48}
            />
          </div>
        ) : createRecipientStatus === 'success' ? (
          <LinkAccountConfirmation recipient={createRecipientResponse} />
        ) : (
          <div className="eb-scrollable-content eb-max-h-[70vh] eb-overflow-y-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="eb-space-y-6 eb-px-4 eb-py-2"
              >
                {/* Error Summary for Debugging */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="eb-mb-4 eb-rounded eb-border eb-border-red-200 eb-bg-red-50 eb-p-3">
                    <p className="eb-mb-2 eb-font-semibold eb-text-red-700">
                      Form Errors:
                    </p>
                    <ul className="eb-list-inside eb-list-disc eb-text-xs eb-text-red-600">
                      {Object.entries(form.formState.errors).map(
                        ([key, value]) => {
                          if (
                            value &&
                            typeof value === 'object' &&
                            'message' in value &&
                            typeof value.message === 'string' &&
                            value.message
                          ) {
                            return (
                              <li key={key}>
                                <strong>{key}:</strong> {value.message}
                              </li>
                            );
                          }
                          return null;
                        }
                      )}
                    </ul>
                  </div>
                )}

                {/* Account Type Section */}
                <div className="eb-space-y-4">
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="eb-text-base eb-font-medium">
                          Account Type{' '}
                          <span className="eb-text-red-600">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleAccountTypeChange(value);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INDIVIDUAL">
                              Individual
                            </SelectItem>
                            <SelectItem value="ORGANIZATION">
                              Business
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Personal/Business Details Section */}
                <div className="eb-space-y-4">
                  {selectedAccountType === 'INDIVIDUAL' && (
                    <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              First Name{' '}
                              <span className="eb-text-red-600">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter first name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Last Name{' '}
                              <span className="eb-text-red-600">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter last name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {selectedAccountType === 'ORGANIZATION' && (
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Business Name{' '}
                            <span className="eb-text-red-600">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter business name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Separator />

                {/* Account Details Section */}
                <div className="eb-space-y-4">
                  <FormField
                    control={form.control}
                    name="routingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Routing Number{' '}
                          <span className="eb-text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter routing number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Account Number{' '}
                          <span className="eb-text-red-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter account number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Authorization Section */}
                <div className="eb-space-y-4">
                  <FormField
                    control={form.control}
                    name="certify"
                    render={({ field }) => (
                      <FormItem className="eb-flex eb-flex-row eb-items-start eb-space-x-3 eb-space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="eb-space-y-1 eb-leading-none">
                          <FormLabel>
                            I authorize verification of my external bank
                            account, including my micro-deposit
                            <span className="eb-text-red-600"> *</span>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="eb-gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Link Account</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
