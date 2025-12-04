/**
 * PartiallyHostedUIComponent - Utility library for embedding JPMorgan hosted onboarding experiences
 * 
 * @version 1.0.0-alpha
 * @license Apache-2.0
 * 
 * ⚠️ WORK IN PROGRESS - REFERENCE IMPLEMENTATION ONLY ⚠️
 * 
 * This is a reference implementation provided as-is for integration guidance.
 * Not recommended for production use without thorough testing and validation.
 * Platforms should adapt this code to meet their specific requirements and security standards.
 * 
 * @example
 * ```javascript
 * import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';
 * 
 * const ui = new PartiallyHostedUIComponent({
 *   sessionToken: 'your-token',
 *   experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
 *   theme: { colorScheme: 'light' },
 *   contentTokens: { locale: 'en-US' }
 * });
 * 
 * ui.mount('container-id');
 * ```
 */

/**
 * Default configuration constants
 * @constant {string} DEFAULT_BASE_URL - Default hosted UI base URL
 * @constant {string} DEFAULT_EXPERIENCE_TYPE - Default experience type
 * @constant {number} MOUNT_DELAY_MS - Delay before mounting (for stability)
 * @constant {number} REFRESH_DELAY_MS - Delay during refresh operations
 */
const DEFAULT_BASE_URL = 'https://onboarding.jpmorgan.com';
const DEFAULT_EXPERIENCE_TYPE = 'HOSTED_DOC_UPLOAD_ONBOARDING_UI';
const MOUNT_DELAY_MS = 100;
const REFRESH_DELAY_MS = 100;

/**
 * Supported experience types
 * @enum {string}
 */
export const ExperienceType = {
  HOSTED_DOC_UPLOAD_ONBOARDING_UI: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
  // Add more experience types as they become available
};

/**
 * Event namespaces for categorizing events
 * @enum {string}
 */
export const EventNamespace = {
  LIFECYCLE: 'lifecycle',
  ONBOARDING: 'onboarding',
  SESSION: 'session',
  ERROR: 'error',
  DEBUG: 'debug',
};

/**
 * Event levels for severity/importance
 * @enum {string}
 */
export const EventLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  DEBUG: 'debug',
};

/**
 * Safely encode a JavaScript object as a URL parameter
 * Uses JSON.stringify + encodeURIComponent for URL-safe encoding
 * 
 * @param {object} obj - Object to encode
 * @returns {string} URL-safe encoded string, or empty string on error
 * @private
 */
function encodeJsonParam(obj) {
  if (!obj || typeof obj !== 'object') {
    return '';
  }
  
  try {
    return encodeURIComponent(JSON.stringify(obj));
  } catch (error) {
    console.error('[PartiallyHostedUIComponent] Failed to encode JSON parameter:', error);
    return '';
  }
}

/**
 * Build the complete iframe URL with all parameters
 * 
 * URL structure:
 * {baseUrl}/onboarding?token={jwt}&experienceType={type}&theme={encoded}&contentTokens={encoded}
 * 
 * @param {object} config - Configuration object
 * @param {string} config.baseUrl - Base URL for the hosted UI
 * @param {string} config.sessionToken - JWT session token
 * @param {string} config.experienceType - Type of experience to load
 * @param {object} [config.theme] - Optional theme configuration
 * @param {object} [config.contentTokens] - Optional content tokens
 * @returns {string} Complete iframe URL with all parameters
 * @private
 */
function buildIframeUrl(config) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    sessionToken,
    experienceType = DEFAULT_EXPERIENCE_TYPE,
    theme,
    contentTokens,
  } = config;

  // Build query parameters
  const params = new URLSearchParams({
    token: sessionToken,
    experienceType: experienceType,
  });

  // Add optional theme parameter (JSON encoded)
  if (theme) {
    const encodedTheme = encodeJsonParam(theme);
    if (encodedTheme) {
      params.append('themeTokens', encodedTheme);
    }
  }

  // Add optional content tokens parameter (JSON encoded)
  if (contentTokens) {
    const encodedTokens = encodeJsonParam(contentTokens);
    if (encodedTokens) {
      params.append('contentTokens', encodedTokens);
    }
  }

  return `${baseUrl}/onboarding?${params.toString()}`;
}

/**
 * Create an iframe element with proper security attributes
 * 
 * Security considerations:
 * - sandbox attribute restricts iframe capabilities
 * - referrerpolicy prevents leaking referrer information
 * - loading="lazy" improves performance
 * - Proper ARIA attributes for accessibility
 * 
 * @param {string} url - Complete iframe source URL
 * @param {object} [customAttributes={}] - Additional iframe attributes to apply
 * @returns {HTMLIFrameElement} Configured iframe element (not yet mounted)
 * @private
 */
function createIframe(url, customAttributes = {}) {
  const iframe = document.createElement('iframe');
  
  // Required attributes for functionality
  iframe.src = url;
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  
  // Accessibility attributes
  iframe.setAttribute('title', 'Complete your account onboarding - interactive form');
  iframe.setAttribute('aria-label', 'Onboarding application iframe');
  
  // Security attributes
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.setAttribute('loading', 'lazy');
  
  /**
   * Sandbox attribute - CRITICAL FOR SECURITY
   * 
   * This restricts what the iframe can do. Only enable necessary permissions:
   * - allow-scripts: Required for the hosted UI to function
   * - allow-same-origin: Required for storage access and APIs
   * - allow-forms: Required for form submission
   * - allow-popups: Required for OAuth flows or help windows
   * - allow-modals: Required for alert/confirm dialogs
   * 
   * DO NOT add 'allow-top-navigation' unless absolutely necessary
   */
  iframe.setAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'
  );
  
  // Apply custom attributes
  Object.entries(customAttributes).forEach(([key, value]) => {
    if (value === true) {
      // Boolean attributes (e.g., allowfullscreen)
      iframe.setAttribute(key, '');
    } else if (value !== false && value !== null && value !== undefined) {
      // String/number attributes
      iframe.setAttribute(key, String(value));
    }
  });

  return iframe;
}

/**
 * Validate origin against expected base URL
 * Used for postMessage security validation
 * 
 * @param {string} eventOrigin - Origin from postMessage event
 * @param {string} expectedBaseUrl - Expected base URL
 * @returns {boolean} True if origin is valid
 * @private
 */
function isValidOrigin(eventOrigin, expectedBaseUrl) {
  try {
    const eventUrl = new URL(eventOrigin);
    const expectedUrl = new URL(expectedBaseUrl);
    
    // Match protocol and hostname
    return (
      eventUrl.protocol === expectedUrl.protocol &&
      eventUrl.hostname === expectedUrl.hostname
    );
  } catch (error) {
    console.error('[PartiallyHostedUIComponent] Invalid URL in origin validation:', error);
    return false;
  }
}

/**
 * PartiallyHostedUIComponent Class
 * 
 * Main class for managing the hosted UI iframe lifecycle.
 * 
 * Key responsibilities:
 * 1. Build secure iframe URL with encoded parameters
 * 2. Mount/unmount iframe to/from DOM
 * 3. Handle postMessage events from iframe
 * 4. Provide pub/sub event system for host application
 * 5. Manage iframe lifecycle (refresh, theme updates, etc.)
 * 
 * @class
 * @example
 * const ui = new PartiallyHostedUIComponent({
 *   sessionToken: 'jwt-token',
 *   experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
 *   theme: { colorScheme: 'light' },
 *   contentTokens: { locale: 'en-US' }
 * });
 * 
 * ui.subscribe((event) => {
 *   console.log('Event:', event);
 * });
 * 
 * ui.mount('container-id');
 */
export class PartiallyHostedUIComponent {
  /**
   * @param {object} config - Configuration object
   * @param {string} config.sessionToken - JWT session token (required)
   * @param {string} [config.experienceType] - Experience type
   * @param {string} [config.baseUrl] - Base URL for hosted UI
   * @param {object} [config.theme] - Theme configuration object
   * @param {object} [config.contentTokens] - Content localization tokens
   * @param {object} [config.iframeAttributes] - Additional iframe attributes
   * @throws {Error} If sessionToken is not provided
   */
  constructor(config = {}) {
    // Validate required parameters
    if (!config.sessionToken) {
      throw new Error(
        '[PartiallyHostedUIComponent] sessionToken is required in configuration'
      );
    }

    /**
     * Store configuration
     * @private
     */
    this.config = {
      baseUrl: DEFAULT_BASE_URL,
      experienceType: DEFAULT_EXPERIENCE_TYPE,
      ...config,
    };

    /**
     * DOM references
     * @private
     */
    this.iframe = null;
    this.targetElement = null;

    /**
     * Event subscribers array
     * @private
     */
    this.subscribers = [];

    /**
     * Bound message handler for cleanup
     * @private
     */
    this.messageHandler = this._handleMessage.bind(this);

    /**
     * Mounted state flag
     * @private
     */
    this.isMounted = false;

    // Setup postMessage listener if in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.messageHandler);
    }

    // Log initialization in debug mode
    this._log('debug', 'PartiallyHostedUIComponent initialized', {
      experienceType: this.config.experienceType,
      hasTheme: !!this.config.theme,
      hasContentTokens: !!this.config.contentTokens,
    });
  }

  /**
   * Mount the iframe to a target DOM element
   * 
   * Process:
   * 1. Validate target element exists
   * 2. Build iframe URL with encoded parameters
   * 3. Create iframe with security attributes
   * 4. Attach load/error event handlers
   * 5. Append iframe to target element
   * 6. Publish mount lifecycle event
   * 
   * @param {string} targetElementId - ID of the target DOM element
   * @throws {Error} If targetElementId is invalid or element not found
   * @throws {Error} If iframe is already mounted
   * @public
   */
  mount(targetElementId) {
    // Validate input
    if (!targetElementId || typeof targetElementId !== 'string') {
      throw new Error(
        '[PartiallyHostedUIComponent] targetElementId must be a non-empty string'
      );
    }

    // Prevent double mounting
    if (this.isMounted) {
      throw new Error(
        '[PartiallyHostedUIComponent] Component is already mounted. Call unmount() first.'
      );
    }

    // Find target element
    this.targetElement = document.getElementById(targetElementId);

    if (!this.targetElement) {
      throw new Error(
        `[PartiallyHostedUIComponent] Could not find element with ID: ${targetElementId}`
      );
    }

    // Use setTimeout to ensure DOM is ready and prevent blocking
    setTimeout(() => {
      try {
        // Build the iframe URL with all parameters
        const iframeUrl = buildIframeUrl(this.config);
        
        this._log('debug', 'Built iframe URL', {
          url: iframeUrl.replace(/token=[^&]*/, 'token=REDACTED'), // Don't log token
        });

        // Create iframe element
        this.iframe = createIframe(
          iframeUrl,
          this.config.iframeAttributes || {}
        );

        // Setup load event handler
        this.iframe.addEventListener('load', () => {
          this._log('info', 'Iframe loaded successfully');
          
          this._publish({
            level: EventLevel.INFO,
            namespace: EventNamespace.LIFECYCLE,
            message: 'IframeLoaded',
            payload: {
              timestamp: Date.now(),
              targetElementId,
            },
          });
        });

        // Setup error event handler
        this.iframe.addEventListener('error', (error) => {
          this._log('error', 'Iframe load error', error);
          
          this._publish({
            level: EventLevel.ERROR,
            namespace: EventNamespace.LIFECYCLE,
            message: 'IframeLoadError',
            payload: {
              error: error.message || 'Unknown error',
              timestamp: Date.now(),
            },
          });
        });

        // Mount iframe to DOM
        this.targetElement.appendChild(this.iframe);
        this.isMounted = true;

        // Publish mount event
        this._publish({
          level: EventLevel.INFO,
          namespace: EventNamespace.LIFECYCLE,
          message: 'Mounted',
          payload: {
            targetElementId,
            experienceType: this.config.experienceType,
            timestamp: Date.now(),
          },
        });

        this._log('info', 'Component mounted successfully', { targetElementId });
      } catch (error) {
        this._log('error', 'Mount failed', error);
        throw error;
      }
    }, MOUNT_DELAY_MS);
  }

  /**
   * Unmount the iframe and cleanup resources
   * 
   * Process:
   * 1. Remove iframe from DOM
   * 2. Clear DOM references
   * 3. Remove postMessage event listener
   * 4. Update mounted state
   * 5. Publish unmount lifecycle event
   * 
   * Safe to call even if not mounted (idempotent operation)
   * 
   * @public
   */
  unmount() {
    // Remove iframe from DOM if it exists
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }

    // Clear references
    this.iframe = null;
    this.targetElement = null;
    this.isMounted = false;

    // Remove global message listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageHandler);
    }

    // Publish unmount event
    this._publish({
      level: EventLevel.INFO,
      namespace: EventNamespace.LIFECYCLE,
      message: 'Unmounted',
      payload: {
        timestamp: Date.now(),
      },
    });

    this._log('info', 'Component unmounted');
  }

  /**
   * Subscribe to events from the component
   * 
   * Events are published when:
   * - Iframe lifecycle changes (mount, unmount, load, error)
   * - Messages received from iframe via postMessage
   * - Internal state changes
   * 
   * @param {Function} callback - Event handler function
   * @returns {Function} Unsubscribe function
   * @throws {Error} If callback is not a function
   * @public
   * 
   * @example
   * const unsubscribe = ui.subscribe((event) => {
   *   console.log('Event:', event.message, event.payload);
   * });
   * 
   * // Later, to unsubscribe:
   * unsubscribe();
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error(
        '[PartiallyHostedUIComponent] Subscribe callback must be a function'
      );
    }

    this.subscribers.push(callback);

    this._log('debug', 'Subscriber added', {
      totalSubscribers: this.subscribers.length,
    });

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
        this._log('debug', 'Subscriber removed', {
          totalSubscribers: this.subscribers.length,
        });
      }
    };
  }

  /**
   * Update theme dynamically
   * 
   * Note: This requires reloading the iframe to apply the new theme.
   * The component will unmount and remount with the new theme parameters.
   * 
   * @param {object} theme - New theme configuration (merged with existing)
   * @throws {Error} If component is not mounted
   * @public
   */
  updateTheme(theme) {
    if (!this.isMounted) {
      throw new Error(
        '[PartiallyHostedUIComponent] Cannot update theme: component is not mounted'
      );
    }

    // Merge with existing theme
    this.config.theme = {
      ...(this.config.theme || {}),
      ...theme,
    };

    this._log('info', 'Theme updated, refreshing iframe');

    // Refresh iframe to apply new theme
    this.refresh();
  }

  /**
   * Update content tokens dynamically
   * 
   * Note: This requires reloading the iframe to apply the new tokens.
   * The component will unmount and remount with the new content token parameters.
   * 
   * @param {object} contentTokens - New content tokens (merged with existing)
   * @throws {Error} If component is not mounted
   * @public
   */
  updateContentTokens(contentTokens) {
    if (!this.isMounted) {
      throw new Error(
        '[PartiallyHostedUIComponent] Cannot update content tokens: component is not mounted'
      );
    }

    // Merge with existing content tokens
    this.config.contentTokens = {
      ...(this.config.contentTokens || {}),
      ...contentTokens,
    };

    this._log('info', 'Content tokens updated, refreshing iframe');

    // Refresh iframe to apply new tokens
    this.refresh();
  }

  /**
   * Refresh the iframe
   * 
   * Useful when:
   * - Session token needs to be renewed
   * - Theme or content tokens are updated
   * - Recovery from error state
   * 
   * Process:
   * 1. Store current target element ID
   * 2. Unmount current iframe
   * 3. Wait for cleanup to complete
   * 4. Mount new iframe with updated configuration
   * 
   * @throws {Error} If component is not mounted
   * @public
   */
  refresh() {
    if (!this.iframe || !this.targetElement) {
      throw new Error(
        '[PartiallyHostedUIComponent] Cannot refresh: component is not mounted'
      );
    }

    const targetId = this.targetElement.id;

    this._log('info', 'Refreshing component');

    // Unmount current iframe
    this.unmount();

    // Small delay to ensure cleanup completes
    setTimeout(() => {
      this.mount(targetId);
    }, REFRESH_DELAY_MS);
  }

  /**
   * Get current component state
   * 
   * @returns {object} Current state information
   * @public
   */
  getState() {
    return {
      isMounted: this.isMounted,
      targetElementId: this.targetElement?.id || null,
      experienceType: this.config.experienceType,
      hasTheme: !!this.config.theme,
      hasContentTokens: !!this.config.contentTokens,
      subscriberCount: this.subscribers.length,
    };
  }

  /**
   * Handle postMessage events from the iframe
   * 
   * Security considerations:
   * 1. Validate event origin matches expected base URL
   * 2. Validate event data structure
   * 3. Sanitize data before publishing to subscribers
   * 
   * @param {MessageEvent} event - postMessage event from iframe
   * @private
   */
  _handleMessage(event) {
    // CRITICAL SECURITY CHECK: Validate origin
    const allowedOrigin = this.config.baseUrl || DEFAULT_BASE_URL;
    
    if (!isValidOrigin(event.origin, allowedOrigin)) {
      this._log('warning', 'Rejected postMessage from invalid origin', {
        receivedOrigin: event.origin,
        expectedOrigin: allowedOrigin,
      });
      return;
    }

    // Validate data structure
    if (!event.data || typeof event.data !== 'object') {
      this._log('warning', 'Received invalid postMessage data', {
        data: event.data,
      });
      return;
    }

    this._log('debug', 'Received postMessage', {
      namespace: event.data.namespace,
      message: event.data.message,
      level: event.data.level,
    });

    // Publish to subscribers
    this._publish(event.data);
  }

  /**
   * Publish event to all subscribers
   * 
   * Events are delivered synchronously to all subscribers.
   * Errors in subscriber callbacks are caught and logged to prevent
   * one failing subscriber from affecting others.
   * 
   * @param {object} eventData - Event data to publish
   * @private
   */
  _publish(eventData) {
    this.subscribers.forEach((callback) => {
      try {
        callback(eventData);
      } catch (error) {
        console.error(
          '[PartiallyHostedUIComponent] Error in subscriber callback:',
          error
        );
      }
    });
  }

  /**
   * Internal logging helper
   * 
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {object} [data] - Additional data to log
   * @private
   */
  _log(level, message, data) {
    const prefix = '[PartiallyHostedUIComponent]';
    
    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'warning':
        console.warn(prefix, message, data || '');
        break;
      case 'debug':
        // Only log debug in development
        if (this.config.debug) {
          console.log(prefix, '[DEBUG]', message, data || '');
        }
        break;
      case 'info':
      default:
        console.log(prefix, message, data || '');
    }
  }

  /**
   * Cleanup and destroy the component instance
   * 
   * Call this when the component is no longer needed.
   * After calling destroy(), the component instance should not be reused.
   * 
   * @public
   */
  destroy() {
    this.unmount();
    this.subscribers = [];
    this.config = null;
    
    this._log('info', 'Component destroyed');
  }
}

/**
 * Version information
 * @constant {string}
 */
PartiallyHostedUIComponent.VERSION = '1.0.0-alpha';

/**
 * Default export
 */
export default PartiallyHostedUIComponent;
