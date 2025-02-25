/**
 * Signature of the function passed as callback in {@link addLeaveActionListener}
 *
 * @param actionId the ID for which the leave is called
 * @param stoptime start resp. endtime of the action
 * @param isRootAction true if the action with the provided ID is a root action
 */
export interface ActionLeaveListener {
  (actionId: number, stoptime: number, isRootAction: boolean): void;
}

/**
 * Signature of the function passed as callback in {@link addEnterActionListener}
 *
 * @param actionId the ID for which the enter is called
 * @param starttime start resp. endtime of the action
 * @param isRootAction true if the action with the provided ID is a root action
 * @param [element] the element which resulted in the initiation of the event
 */
export interface ActionEnterListener {
  (
    actionId: number,
    starttime: number,
    isRootAction: boolean,
    element?: EventTarget | string
  ): void;
}

/**
 * Signature of new the view to start.
 *
 * @param name  New view name. Usually it matches the location.pathname or location.hash
 * @param group New view group. It is recommended to contain the dynamic placeholders of the view name.
 *              For example, if the view name is "/books/123", view group should be "books/:bookId" or similar.
 */
export interface APIPage {
  name: string;
  group: string;
}

// ts-prune-ignore-next Ignored because it is not used, but should still show up in typedoc
export type PageLeaveListener = (unloadRunning: boolean) => void;

export type AllowedMapTypes = Date | string | number;

// this is used for dtrum doc
// eslint-disable-next-line @typescript-eslint/naming-convention -- dtrum is fine here
export type dtrum = DtrumApi;

export interface Property<S> {
  value: S;
  public?: boolean;
}

export interface PropertyMap<S extends AllowedMapTypes> {
  [key: string]: Property<S> | S;
}

export interface FailedProperty {
  key: string;
  reason: string;
}

export interface SuccessfulProperty {
  key: string;
  value: AllowedMapTypes;
}

export interface PropertiesSendingReport {
  failedProperties: FailedProperty[];
  sentProperties: SuccessfulProperty[];
  info: string;
}

export interface PropertyObject {
  javaLong?: PropertyMap<number>;
  date?: PropertyMap<Date>;
  shortString?: PropertyMap<string>;
  javaDouble?: PropertyMap<number>;
}

export interface DtRumUserInput {
  target: EventTarget | string | undefined;
  name: string;
  info: string;
  title: string;
}

/**
 * Defines the type of resources for the summary
 */
export const enum ResourceSummaryTypes {
  /** Stylesheet resource (e.g. .css) */
  CSS = 'c',
  /** Custom resource */
  CUSTOM = 'y',
  /** Image resource (e.g. .jpg, .png) */
  IMAGES = 'i',
  /** Undefined resource */
  OTHER = 'o',
  /** Script resource (e.g. .js) */
  SCRIPTS = 's',
}

/**
 * Provides information about call results to actionName.
 */
export const enum ActionNameResult {
  /** Action naming was successful with the provided name */
  SUCCESS = 0,
  /** The action with the provided ID was not found, or there was no currently active action */
  ACTION_NOT_FOUND = 1,
  /** The provided action name was not of type string */
  INVALID_ACTION_NAME = 2,
  /** The provided action ID was provided, not of type number */
  INVALID_ACTION_ID = 3,
}

export interface MetaData {
  /**
   * An internally used id
   *
   * @hidden
   */
  id: string;
  /**
   * Specifies where the metadata is collected from:
   * * CSS Selector
   * * JavaScript Variable
   * * Cookie
   * * Query String
   * * JavaScript Function
   */
  type: string;
  /**
   * How the metadata can be retrieved(cookie name, css selector, javascript variable name, ...)
   */
  expression: string;
  /**
   * The current value for the given expression
   */
  value: string | null;
  /**
   * Shows information about captured value
   */
  info?: string;
}

export interface DtrumApi {
  /**
   * Enables/disables automatic action detection. Use when you want to instrument your application only manually.
   *
   * @see {@link enterAction}
   * @see {@link leaveAction}
   * @param enabled Whether automatic action detection should be enabled or disabled
   */
  setAutomaticActionDetection(enabled: boolean): void;
  /**
   * Tells the RUM monitoring code to not automatically detect the load end event.
   * The load end event must be set explicitly via {@link signalLoadEnd}.
   * Needs to be called immediately after the RUM monitoring code is injected!
   *
   */
  setLoadEndManually(): void;
  /**
   * Signals that the page has finished loading.
   * Use in combination with {@link setLoadEndManually} to define your own load end times.
   *
   * @see {@link setLoadEndManually}
   */
  signalLoadEnd(): void;
  /**
   * Report the HTTP status code and a custom message for the response of the current page.
   * For example, use to mark your 404 pages that respond with a HTTP status code of 200.
   * Needs to be called before the onload event of the page has finished, otherwise the information will be discarded.
   *
   * @param responseCode Sets the HTTP status code
   * @param message An additional informational message
   * @returns false if the values were incorrect or the function has been called too late, true otherwise
   */
  markAsErrorPage(responseCode: number, message: string): boolean;
  /**
   * Reports the HTTP status code and an additional message for the response of the current XHR action.
   * For example, use when the HTTP status code of your XHR response returns 200, while the result returned
   * by the server indicates a failed request.
   * Needs to be called before the XHR action is finished and all listeners have been invoked.
   *
   * @param responseCode The response code of the current XHR action
   * @param message An additional informational message
   * @param parentActionId The optional ID of the action to mark as failed. If it is not present,
   * the currently open action is used.
   * @returns false if the values were incorrect or the function has been called too late, true otherwise
   */
  markXHRFailed(
    responseCode: number,
    message: string,
    parentActionId?: number
  ): boolean;
  /**
   * Forces beacon sending to make sure actions aren't lost.
   * For example, use before a window unload event by adding a {@link addPageLeavingListener}.
   *
   * @see {@link addPageLeavingListener}
   * @param forceSync Force synchronous sending of beacons. If false, the beacon will be sent asynchronously.
   * @param sendPreview Force sending of preview beacons which haven't been closed yet.
   * @param killUnfinished Kills unfinished actions and sends them immediately. Handle with care, actions might be inaccurate.
   */
  sendBeacon(
    forceSync: boolean,
    sendPreview: boolean,
    killUnfinished: boolean
  ): void;
  /**
   * Enters a new custom action. Use to set the load start event for a new custom action.
   * Needs to be called before {@link leaveAction}, which closes the custom action.
   *
   * @see {@link leaveAction}
   * @param actionName Name of the action
   * @param actionType DEPRECATED: not used any more and has no effect if provided
   * @param startTime Timestamp in milliseconds. if null, current time is used.
   * @param sourceUrl Source url for the action
   * @returns ID of the created action
   */
  'enterAction'(
    actionName: string,
    actionType?: string,
    startTime?: number,
    sourceUrl?: string
  ): number;
  /**
   * Attaches a listener that gets called while entering an action <br />
   * Remove the listener if not needed or make sure to filter actions if using {@link addActionProperties},
   * to prevent sending the same action property for every action.
   * Use to hook into automatic action creation event to influence related concepts like
   * action naming or action properties.
   *
   * @see {@link removeEnterActionListener}
   * @see {@link actionName}
   * @see {@link addActionProperties}
   * @param listener A function that will be called when entering a new action
   */
  addEnterActionListener(listener: ActionEnterListener): void;
  /**
   * Removes a previously attached listener that detects the enter action event
   *
   * @param listener The reference to the listener that needs to be removed
   */
  removeEnterActionListener(listener: ActionEnterListener): void;
  /**
   * Leaves an action that has previously been created by an enterAction call.
   * Use to set the load end event for a custom action and to complete its creation.
   * Needs to be called after {@link enterAction}.
   *
   * @see {@link enterAction}
   * @param actionId ID of the action to leave. must be the value returned by enterAction
   * @param stopTime Timestamp in milliseconds.
   * Note that, when providing a stop time, it will force stop the action and prevent visually complete from extending it.
   * @param startTime Optional start time in milliseconds (necessary if start time should be modified).
   * Note that, when providing a start time, it mustn't be longer than an hour in the past, otherwise the
   * RUM monitoring code will ignore it.
   */
  'leaveAction'(actionId: number, stopTime?: number, startTime?: number): void;
  /**
   * Attaches a listener that gets called when leaving an action <br />
   * Remove the listener if not needed or make sure to filter actions if using {@link addActionProperties},
   * to prevent sending the same action property for every action.
   * Use to hook into the out of the box action closing event.
   *
   * @see {@link removeLeaveActionListener}
   * @see {@link addActionProperties}
   * @param  listener A function that will be called when leaving an action
   */
  addLeaveActionListener(listener: ActionLeaveListener): void;
  /**
   * Removes a previously attached listener that detects the leave action event
   *
   * @param  listener A leave action listener to be removed
   */
  removeLeaveActionListener(listener: ActionLeaveListener): void;
  /**
   * Adds custom {@link https://www.dynatrace.com/support/help/shortlink/user-session-properties | action properties}
   * to the currently active action.  <br />
   * Only accepts valid java long, java double (as a string representation), Date objects, and
   *          short strings with a maximum length of 100 characters. <br />
   * Action properties must be defined first under Application settings and use a lower case key.
   *
   * @see {@link sendSessionProperties}
   * @param parentActionId ID of the action.
   * @param javaLong JSON object containing key value pairs of valid numbers. <br /> Value should be between
   *          range -9223372036854776000 & 9223372036854776000
   * @param date JSON object containing key value pairs of JavaScript Date objects.<br />  Value should be JavaScript Date object
   * @param shortString JSON object containing key value pairs of strings.<br />  Value character count should be less
   *          than 100 characters
   * @param javaDouble JSON object containing key value pairs of valid floating point numbers.<br />
   * Value should be between range -1.7976931348623157e+308 & 1.7976931348623157e+308
   *
   * Each key value pair must be defined in the following format 'key: { value: value<AllowedMapTypes>, public?: boolean }'
   * Public property is optional and if not declared as true values will be sent as masked(dT_pv) in doNotTrack mode
   */
  addActionProperties(
    parentActionId: number,
    javaLong?: PropertyMap<number>,
    date?: PropertyMap<Date>,
    shortString?: PropertyMap<string>,
    javaDouble?: PropertyMap<number>
  ): void;
  /**
   * Reports an error object to Dynatrace. Use when you catch errors in your own application code
   * but you also want to propagate them to Dynatrace instead of logging them yourself.
   * If errors are handled by your own application code it will stop the error from being handled
   * by the global JavaScript {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror | onerror event handler},
   * which is used by Dynatrace to automatically capture JavaScritp errors.
   *
   * @param error The error to be reported. Any browser error object is supported and if the error doesn't
   *  have a stacktrace the RUM JavaScipt monitoring code will attempt to generate one.
   *   Alternatively create your own object that has the following properties set: 'message',
   *   'file', 'line', 'column', and 'stack'. The 'message' property must be provided; all other values are optional.
   * @param parentActionId parent action id. if not passed or null, error is added to current action
   */
  reportError(error: Error | string, parentActionId?: number): void;
  /**
   * Sets the {@link https://www.dynatrace.com/support/help/shortlink/user-tagging#user-tagging-via-javascript-api | user tag}.
   * Use to identify individual users across different browsers, devices, and user sessions.
   *
   * @param value The name of the user. For example, use a name, userid, or your user's email address.
   */
  identifyUser(value: string): void;
  /**
   * Adds a listener that is called when the user is leaving the page, but before the RUM monitoring beacon is sent
   * Use when you want to hook into the unload of the page.
   *
   * @param listener A function that will be called in case the user leaves the page
   */
  addPageLeavingListener(listener: PageLeaveListener): void;
  /**
   * Indicates the start of a user input. User inputs must always be stopped by calling {@link endUserInput}.
   * If an XHR call or a page load happens, the RUM monitoring code checks if a user input is active. If so, that user input is
   *          set to have triggered the user action.
   * Use when a user input is not automatically detected by the RUM monitoring code.
   *
   * @see {@link endUserInput}
   * @param domNode DOM node which triggered the action (button, etc) or a string is used for determining its caption
   * @param type Type of action: 'click', 'keypress', 'scroll',...
   * @param addInfo Additional info for user input such as key, mouse button, etc ('F5', 'RETURN',...)
   * @param validTime How long this userInput should be valid(in ms)
   * @returns An object containing all the information about the userInput
   */
  beginUserInput(
    domNode: HTMLElement | string,
    type: string,
    addInfo?: string,
    validTime?: number
  ): DtRumUserInput;
  /**
   * Ends a user input.
   *
   * @param userInputObject The user input object returned by {@link beginUserInput}
   */
  endUserInput(userInputObject: DtRumUserInput): void;
  /**
   * Extends or initiates actions.
   * Use when you want to extend an active Load or XHR action by another unlinked XHR call (i.e., action).
   * This is particularly useful when the XHR call in question is asynchronous in nature
   * and therefore can't automatically be correlated to an action, which otherwise
   * would lead to the action being closed too early and inaccurate metrics measurements (e.g., user action duration).
   * Needs to be called before {@link leaveXhrAction}.
   *
   * @see {@link leaveXhrAction}
   * @param type Optional additional info about type of XHR (e.g., framework name, etc.)
   * @param xmode XHR action creation mode
   *          0 ... Just extend running XHR actions
   *          1 ... Extend any running action
   *          3 ... Start action if user input is present
   * @param xhrUrl url of the requested resource
   * @returns ID of the XhrAction
   */
  enterXhrAction(type: string, xmode?: 0 | 1 | 3, xhrUrl?: string): number;
  /**
   * Indicates the end of an XHR action
   *
   * @param actionId ID of the XHR Action
   * @param [stopTime] The stop time of the XHR Action
   */
  leaveXhrAction(actionId: number, stopTime?: number): void;
  /**
   * Indicates that an XHR callback is active (eg. XMLHttpRequest onreadystatechange) and relinks subsequently triggered XHR actions.
   * For example, when an XHR callback adds a script tag to your page, any XHR call triggered by it
   * would not be automatically added to the currently running action.
   * Calling this function allows relinking to such a subsequent XHR call (i.e., XHR actions) to its initial action.
   * The XHR callback must also be stopped by {@link leaveXhrCallback}.
   *
   * @param actionId ID of the action where callback belongs to
   */
  enterXhrCallback(actionId: number): void;
  /**
   * Indicates the end of an XHR callback.
   *
   * @see {@link enterXhrCallback}
   * @param actionId ID of the action where callback belongs to
   */
  leaveXhrCallback(actionId: number): void;
  /**
   * Indicates the start of a load action. Frameworks often have their own load callback functions
   * this can be used when framework starts load before 'DOMContentLoaded'.
   *
   */
  signalOnLoadStart(): void;
  /**
   * Signals that the load end event is provided manually.
   * Use when you want to extend the onload duration (e.g. to encompass also the initialization of a framework)
   *
   * @see {@link setLoadEndManually}
   * Notifies the RUM monitoring code to wait for an additional call of {@link signalOnLoadEnd}, before closing the 'onload' action.
   * Note: Only when {@link signalOnLoadEnd} is called after, the load action will use the provided load end event correctly.
   *
   */
  incrementOnLoadEndMarkers(): void;
  /**
   * Indicates the end of a load action. needs {@link incrementOnLoadEndMarkers} to be called before.
   * When the last {@link signalOnLoadEnd} is called, the action is closed.
   *
   * @see {@link signalOnLoadStart}
   */
  signalOnLoadEnd(): void;
  /**
   * Sets the actionName of the currently active action, or the action with the provided id
   *
   * @param actionName The new name of the action
   * @param actionId The action ID of the to be updated action name
   * @returns an {@link  ActionNameResult} whether the process was successful
   */
  actionName(actionName: string, actionId?: number): ActionNameResult;
  /**
   * Ends the currently active session immediately.
   */
  endSession(): void;
  /**
   * Returns the current time in milliseconds.
   * It automatically chooses the most accurate way to determine the current time.
   *
   * @returns the current time in milliseconds
   */
  now(): number;
  /**
   * Enables the RUM monitoring code in case it was initially disabled via the
   * {@link https://www.dynatrace.com/support/help/shortlink/configure-rum-privacy#opt-in-mode | opt-in mode}.
   * Use in combination with a user consent tool to enable RUM monitoring in case the consent has been provided.
   *
   * @see {@link disable}
   */
  enable(): void;
  /**
   * Disables the RUM monitoring code and removes all cookies in case dtrum.enable() has been called earlier,
   * enabling the {@link https://www.dynatrace.com/support/help/shortlink/configure-rum-privacy#opt-in-mode | opt-in mode}.
   * Use in combination with a user consent tool to disable RUM monitoring in case the consent has not been provided.
   *
   * @see {@link enable}
   */
  disable(): void;
  /**
   * Adds a listener that gets triggered when the current visit times out and before a new visit id is generted.
   *
   * @param listener The listener to add
   */
  addVisitTimeoutListener(
    listener: (visitId: string, newVisitAfterTimeout: boolean) => void
  ): void;
  /**
   * Enables session replay
   *
   * @param ignoreCostControl Allows to enable session replay despite cost control configuration
   */
  enableSessionReplay(ignoreCostControl: boolean): void;
  /**
   * Disables session replay
   */
  disableSessionReplay(): void;
  /**
   * Get and evaluate meta-data for the page.
   * Use to troubleshoot RUM monitoring.
   *
   * @returns Array of metadata objects with configured ids, type, expression, and captured values
   */
  getAndEvaluateMetaData(): {
    id: string;
    type: string;
    expression: string;
    value: string | null;
    failureReason?: string;
  }[];
  /**
   * Enables persistent values again. Only applies if 'disablePersistentValues' has been called previously.
   * Use when you want to re-enable monitoring returning users.
   */
  enablePersistentValues(): void;
  /**
   * Removes all traces of persistent values and disables all functionality that would
   * recreate one. Note that this has to be called on every page, since it removes persistent RUM monitoring data, including
   * the information that persistent data shouldn't be stored.
   * Use when you want to disable monitoring of returning users.
   * Read more about {@link https://www.dynatrace.com/support/help/shortlink/cookies#cookie-storage | cookie storage}.
   *
   * @param remember If true, this configuration state is persisted in local storage, so that it doesn't
   *  reset on each page load
   */
  disablePersistentValues(remember: boolean): void;
  /**
   * Registers a method which will be invoked before the 'diff' action in session replay during recording.
   *
   * @param method Listener which will be called before diff action. Listener receives one argument
   * which is a string with diff. Listener also must return the diff string.
   * Read more about {@link https://www.dynatrace.com/support/help/shortlink/cookies#cookie-storage | cookie storage}.
   */
  registerPreDiffMethod(method: (diff: string) => string): void;
  /**
   * Sends {@link https://www.dynatrace.com/support/help/shortlink/user-session-properties | session properties} on a beacon
   * currently only accepts valid java long, java double (as a string representation), Date objects, and short strings of
   * a maximum length of 100 characters. <br />
   * NOTE: session properties need to have a lower case key! <br />
   *
   * Make sure to first define session properties under Application settings before making this API call.
   *
   * @see {@link addActionProperties} is related and works similarly.
   * @param javaLongOrObject JSON object containing key value pairs of valid numbers. <br /> Value should be between range -9223372036854776000 & 9223372036854776000
   * @param date JSON object containing key value pairs of JavaScript date objects.<br />  Value should be JavaScript Date object
   * @param shortString JSON object containing key value pairs of strings.<br />  Value character count should be less than
   *          100 characters
   * @param javaDouble JSON object containing key value pairs of valid floating point numbers.<br />
   * Value should be between range -1.7976931348623157e+308 & 1.7976931348623157e+308
   *
   * Each key value pair must be defined in the following format 'key: { value: value<AllowedMapTypes>, public?: boolean }'
   * Public property is optional and if not declared as true values will be sent as masked(dT_pv) in doNotTrack mode
   *
   * @returns Status report about properties that were passed to the function.
   *          It contains data about failed properties with the failure reason.
   *          Contains data about properties that were sent successfully and a general message with information about total failed properties.
   */
  sendSessionProperties(
    javaLongOrObject?: PropertyMap<number> | PropertyObject,
    date?: PropertyMap<Date>,
    shortString?: PropertyMap<string>,
    javaDouble?: PropertyMap<number>
  ): PropertiesSendingReport | undefined;
  /**
   * Report your own{@link https://www.dynatrace.com/support/help/shortlink/configure-application-errors#configure-custom-errors | custom errors}.
   * For example, use when you want to capture form validation errors in your signup process.
   * Custom errors must first be defined in the Application settings.
   *
   * @param key The key of the error. For example, 'validation error'
   * @param value The error value. For example, 'Email validation failed'
   * @param hint A hint to pinpoint the problem, e.g. content of the input element which triggered the failed validation
   * @param parentingInfo How the custom error should be attached (default = false),
   *               [case number]: To which open action the custom error event should be attached,
   *              [case boolean]: If true it will get attached to the current active action
   */
  reportCustomError(
    key: string,
    value: string,
    hint?: string,
    parentingInfo?: number | boolean
  ): void;

  /**
   * Enables manual page detection.
   * After this is called the RUM monitoring code will stop detecting page and page group names automatically and only accepts them via {@link setPage}.
   * It is recommended to call this as early as possible.
   */
  enableManualPageDetection(): void;

  /**
   * Starts a new page view and reports it to dynatrace server.
   *
   * @param newPage New page containing page name and page group.
   * @returns       1 if new page is started succesfully.
   *                2 if new page is started during onload. It means it is cached and will be sent with load action.
   *                -1 if page that is being set is the same as previous one.
   *                -2 if page is trying to be set but mechanism is not active. Probably 'dtrum.enableManualPageDetection()' was not called.
   *                Negative number means new page failed to start and positive means that new page is started successfully.
   */
  'setPage'(newPage: APIPage): number;
}

declare global {
  interface Window {
    dtrum?: DtrumApi;
  }
}
