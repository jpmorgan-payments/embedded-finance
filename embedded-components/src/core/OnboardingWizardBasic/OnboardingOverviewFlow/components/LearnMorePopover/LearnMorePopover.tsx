import { FC, ReactNode, useState } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui';

type LearnMorePopoverTriggerProps = {
  content: ReactNode;
  children?: ReactNode;
};

export const LearnMorePopoverTrigger: FC<LearnMorePopoverTriggerProps> = ({
  content,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 640px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:eb-max-w-[425px]">
          {content}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" className="eb-w-full">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="eb-px-12">
        <div>{content}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button
              variant="secondary"
              className="eb-w-full eb-text-lg"
              size="lg"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
