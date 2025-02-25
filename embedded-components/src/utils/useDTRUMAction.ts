import { useCallback, useEffect } from 'react';

export const useEnableDTRUMTracking = ({
  userEmail,
  DOMElementToTrack,
  eventsToTrack = ['click', 'focus', 'blur'],
}: {
  userEmail: string;
  DOMElementToTrack: string;
  eventsToTrack: string[];
}) => {
  const eventAnnotationHandler = useCallback((e: Event) => {
    const startTime = new Date().getTime();
    const stopTime = new Date().getTime() + 1;
    const target = e.target as HTMLTextAreaElement;
    if (Object.keys(target.dataset).includes('dtrumTracking')) {
      const actionName = `${e.type} on ${target.dataset?.dtrumTracking}`;
      triggerCustomDTRUMAction({ actionName, stopTime, startTime });
    }
  }, []);

  useEffect(() => {
    if (!window.dtrum) return;
    window?.dtrum?.identifyUser?.(userEmail);
  }, [userEmail]);

  useEffect(() => {
    const wrapper = document.getElementById(DOMElementToTrack);
    eventsToTrack.forEach(
      (evt) => wrapper && wrapper.addEventListener(evt, eventAnnotationHandler)
    );

    // eslint-disable-next-line consistent-return
    return () => {
      eventsToTrack.forEach(
        (evt) =>
          wrapper && wrapper.removeEventListener(evt, eventAnnotationHandler)
      );
    };
  }, [DOMElementToTrack, eventAnnotationHandler]);
};

export const triggerCustomDTRUMAction = ({
  actionName,
  stopTime,
  startTime,
}: {
  actionName: string;
  stopTime?: number;
  startTime?: number;
}) => {
  if (window?.dtrum) {
    const actionId = window?.dtrum?.enterAction(actionName);
    window?.dtrum?.leaveAction(actionId, stopTime, startTime);
  } else {
    console.log(
      `DTRUM is not enabled. Event: ${actionName}. StartTime: ${startTime}, StopTime: ${stopTime}`
    );
  }
};
