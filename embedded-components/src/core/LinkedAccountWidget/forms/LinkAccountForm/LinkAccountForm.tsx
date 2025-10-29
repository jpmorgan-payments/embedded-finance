import { FC, ReactNode, useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  useCreateRecipient,
  useGetAllRecipients,
} from '@/api/generated/ep-recipients';
import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui';

import { RECIPIENT_STATUS_MESSAGES } from '../../LinkedAccountWidget.constants';
import { LinkAccountConfirmation } from './LinkAccountConfirmation';
import {
  LinkAccountFormDataType,
  LinkAccountFormSchema,
} from './LinkAccountForm.schema';
import { PaymentTypeSelector } from './PaymentTypeSelector';

type LinkAccountFormDialogTriggerProps = {
  children: ReactNode;
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
};

/**
 * LinkAccountFormDialogTrigger - Dialog for linking a new bank account
 * Follows OnboardingFlow patterns for form structure and validation
 */
export const LinkAccountFormDialogTrigger: FC<
  LinkAccountFormDialogTriggerProps
> = ({ children, onLinkedAccountSettled }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const form = useForm<LinkAccountFormDataType>({
    resolver: zodResolver(LinkAccountFormSchema),
    defaultValues: {
      accountType: 'INDIVIDUAL',
      firstName: '',
      lastName: '',
      businessName: '',
      routingNumber: '',
      accountNumber: '',
      bankAccountType: 'CHECKING',
      paymentTypes: ['ACH'],
      address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        countryCode: 'US',
      },
      certify: false,
    },
  });

  const {
    mutate: createRecipient,
    reset: resetCreateRecipient,
    status: createRecipientStatus,
    data: createRecipientResponse,
    error: createRecipientError,
  } = useCreateRecipient();

  const { refetch: refetchRecipients } = useGetAllRecipients();

  // Watch form values for conditional rendering
  const accountType = form.watch('accountType');
  const paymentTypes = form.watch('paymentTypes');

  // Determine if address fields should be shown
  const showAddressFields = useMemo(
    () => paymentTypes.includes('WIRE') || paymentTypes.includes('RTP'),
    [paymentTypes]
  );

  const onSubmit = (data: LinkAccountFormDataType) => {
    // Build routing information based on selected payment types
    const routingInformation = data.paymentTypes.map((type) => ({
      routingCodeType: type === 'WIRE' ? 'SWIFT' : 'USABA',
      routingNumber: data.routingNumber,
      transactionType: type,
    }));

    // Build request payload
    const payload: any = {
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
        type: data.bankAccountType,
        number: data.accountNumber,
        routingInformation,
        countryCode: 'US',
      },
    };

    // Add address if provided (required for Wire/RTP)
    if (showAddressFields && data.address) {
      payload.partyDetails.address = {
        addressLine1: data.address.addressLine1,
        addressLine2: data.address.addressLine2,
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.postalCode,
        countryCode: data.address.countryCode,
      };
    }

    createRecipient(
      { data: payload },
      {
        onSuccess: (response) => {
          refetchRecipients();
          onLinkedAccountSettled?.(response);
        },
        onError: (error) => {
          const apiError = error.response?.data as ApiError;
          onLinkedAccountSettled?.(undefined, apiError);
        },
      }
    );
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      resetCreateRecipient();
      form.reset();
    }
    setDialogOpen(open);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-[90vh] eb-max-w-2xl eb-overflow-hidden eb-p-0">
        <DialogHeader className="eb-space-y-2 eb-border-b eb-p-6 eb-pb-4">
          <DialogTitle className="eb-text-xl">
            {createRecipientStatus === 'success'
              ? 'Account Linked Successfully'
              : 'Link a Bank Account'}
          </DialogTitle>
          <DialogDescription>
            {createRecipientStatus === 'success'
              ? (RECIPIENT_STATUS_MESSAGES[
                  createRecipientResponse?.status ?? ''
                ] ?? 'Your external account has been linked.')
              : 'Connect your external bank account to enable payments'}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {createRecipientStatus === 'pending' && (
          <div className="eb-flex eb-h-96 eb-items-center eb-justify-center">
            <div className="eb-text-center">
              <Loader2Icon className="eb-mx-auto eb-mb-4 eb-h-10 eb-w-10 eb-animate-spin eb-text-primary" />
              <p className="eb-text-sm eb-text-muted-foreground">
                Linking your account...
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {createRecipientStatus === 'success' && (
          <div className="eb-px-6 eb-pb-6">
            <LinkAccountConfirmation recipient={createRecipientResponse} />
            <DialogFooter className="eb-mt-6">
              <DialogClose asChild>
                <Button className="eb-w-full">Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}

        {/* Form State */}
        {createRecipientStatus === 'idle' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="eb-flex eb-flex-col">
              <div className="eb-max-h-[calc(90vh-180px)] eb-overflow-y-auto eb-px-6">
                <div className="eb-space-y-6 eb-py-4">
                  {/* Error Alert */}
                  {createRecipientStatus === 'error' && createRecipientError && (
                    <Alert variant="destructive">
                      <AlertTitle>Unable to link account</AlertTitle>
                      <AlertDescription>
                        {(createRecipientError.response?.data as ApiError)
                          ?.message || 'An error occurred. Please try again.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Account Holder Type */}
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem className="eb-space-y-3">
                        <FormLabel asterisk>Account Holder Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="eb-flex eb-flex-col eb-space-y-2"
                          >
                            <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0 eb-rounded-lg eb-border eb-p-3">
                              <FormControl>
                                <RadioGroupItem value="INDIVIDUAL" />
                              </FormControl>
                              <FormLabel className="eb-flex-1 eb-cursor-pointer eb-font-normal">
                                Individual / Personal Account
                              </FormLabel>
                            </FormItem>
                            <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0 eb-rounded-lg eb-border eb-p-3">
                              <FormControl>
                                <RadioGroupItem value="ORGANIZATION" />
                              </FormControl>
                              <FormLabel className="eb-flex-1 eb-cursor-pointer eb-font-normal">
                                Business / Organization Account
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Account Holder Details */}
                  {accountType === 'INDIVIDUAL' ? (
                    <div className="eb-space-y-4">
                      <h3 className="eb-text-sm eb-font-semibold">Account Holder Information</h3>
                      <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel asterisk>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="John" />
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
                              <FormLabel asterisk>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Doe" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormDescription>
                        Must exactly match the name on your bank account
                      </FormDescription>
                    </div>
                  ) : (
                    <div className="eb-space-y-4">
                      <h3 className="eb-text-sm eb-font-semibold">Business Information</h3>
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel asterisk>Business Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Acme Corporation" />
                            </FormControl>
                            <FormDescription>
                              Must exactly match the business name on your bank account
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Bank Account Details */}
                  <div className="eb-space-y-4">
                    <h3 className="eb-text-sm eb-font-semibold">Bank Account Details</h3>
                    <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                      <FormField
                        control={form.control}
                        name="routingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel asterisk>Routing Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="123456789"
                                maxLength={9}
                              />
                            </FormControl>
                            <FormDescription>9-digit ABA routing number</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankAccountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel asterisk>Account Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="CHECKING">Checking</SelectItem>
                                <SelectItem value="SAVINGS">Savings</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel asterisk>Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1234567890" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Payment Methods */}
                  <FormField
                    control={form.control}
                    name="paymentTypes"
                    render={({ field }) => (
                      <FormItem>
                        <PaymentTypeSelector
                          selectedTypes={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address Fields (shown when Wire or RTP is selected) */}
                  {showAddressFields && (
                    <>
                      <Separator />
                      <div className="eb-space-y-4">
                        <div>
                          <h3 className="eb-text-sm eb-font-semibold">Address Information</h3>
                          <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
                            Required for Wire Transfer and Real-Time Payment methods
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="address.addressLine1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel asterisk>Street Address</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="123 Main St" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="address.addressLine2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2 (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Apt 4B" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                          <FormField
                            control={form.control}
                            name="address.city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel asterisk>City</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="New York" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="address.state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel asterisk>State</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="NY"
                                    maxLength={2}
                                    className="eb-uppercase"
                                  />
                                </FormControl>
                                <FormDescription>2-letter code</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="address.postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel asterisk>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="10001" maxLength={10} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Certification */}
                  <FormField
                    control={form.control}
                    name="certify"
                    render={({ field }) => (
                      <FormItem className="eb-flex eb-flex-row eb-items-start eb-space-x-3 eb-space-y-0 eb-rounded-lg eb-border eb-bg-muted/30 eb-p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="eb-space-y-1">
                          <FormLabel asterisk>Authorization</FormLabel>
                          <FormDescription className="eb-text-xs">
                            I authorize verification of this external bank account, including microdeposit verification if required. I certify that the information provided is accurate and matches my bank account details.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="eb-border-t eb-p-6">
                <DialogFooter className="eb-gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Link Account</Button>
                </DialogFooter>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
