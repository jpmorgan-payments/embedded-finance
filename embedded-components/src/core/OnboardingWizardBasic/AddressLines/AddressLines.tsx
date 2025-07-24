import { FC } from 'react';
import { useFieldArray } from 'react-hook-form';

import { InfoPopover } from '@/components/LearnMorePopover';
import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui';

type AddressLinesProps = {
  control: any;
  addressIndex: number;
};

export const AddressLines: FC<AddressLinesProps> = ({
  control,
  addressIndex,
}) => {
  const {
    fields: addressLineFields,
    append: appendAddressLine,
    remove: removeAddressLine,
  } = useFieldArray({
    control,
    name: `addresses.${addressIndex}.addressLines`,
    rules: {
      maxLength: 5,
      minLength: 1,
    },
  });

  return (
    <>
      <FormField
        control={control}
        name={`addresses.${addressIndex}.addressLines.0`}
        render={({ field }) => (
          <FormItem>
            <div className="eb-flex eb-items-center eb-space-x-2">
              <FormLabel asterisk>Address Line 1</FormLabel>
              <InfoPopover>
                The first line must not be a PO Box and must begin with a
                number.
              </InfoPopover>
            </div>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {addressLineFields.map((addressLineField, index) => {
        if (index === 0) return null;
        return (
          <FormField
            key={addressLineField.id}
            control={control}
            name={`addresses.${addressIndex}.addressLines.${index}`}
            render={({ field }) => (
              <FormItem>
                <div className="eb-flex eb-items-center eb-space-x-2">
                  <FormLabel>Address Line {index + 1}</FormLabel>
                </div>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      })}
      <div className="eb-grid eb-grid-cols-2 eb-gap-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendAddressLine('')}
          disabled={addressLineFields.length >= 5}
        >
          Add Line
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => removeAddressLine(addressLineFields.length - 1)}
          disabled={addressLineFields.length <= 1}
        >
          Remove Line
        </Button>
      </div>
    </>
  );
};
