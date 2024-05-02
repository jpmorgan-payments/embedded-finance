import { SchemasQuestionResponse } from '@/api/generated/embedded-banking.schemas';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Stack,
  TextArea,
} from '@/components/ui';

type QuestionFormProps = {
  question: SchemasQuestionResponse;
  form: any;
};

const QuestionForm = ({ question, form }: QuestionFormProps) => {
  return (
    <>
      {question?.responseSchema?.items?.type === 'boolean' ? (
        <FormField
          control={form.control}
          name={`${question?.id}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="eb-my-5" asterisk>
                {question?.content && question.content[0].label}
              </FormLabel>

              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="eb-flex eb-flex-row eb-space-y-1"
                >
                  <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                    <RadioGroupItem value="yes" />

                    <FormLabel className="eb-font-normal">Yes</FormLabel>
                  </FormItem>
                  <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                    <RadioGroupItem value="no" />

                    <FormLabel className="eb-font-normal">No</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={form.control}
          name={`${question?.id}`}
          render={({ field }) => (
            <FormItem>
              <Stack>
                <FormLabel className="eb-my-5" asterisk>
                  {question?.content && question.content[0].label}
                </FormLabel>
                <FormControl>
                  <TextArea
                    {...field}
                    size="md"
                    className="eb-h-30 eb-border-solid eb-border"
                  />
                </FormControl>
                <FormMessage />
              </Stack>
            </FormItem>
          )}
        />
      )}
      <Separator />
    </>
  );
};

export { QuestionForm };
