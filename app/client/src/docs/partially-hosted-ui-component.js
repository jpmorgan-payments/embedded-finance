/**
 * PartiallyHostedUIComponent - UMD Build
 * Universal Module Definition wrapper for broader compatibility
 * 
 * @version 1.0.0-alpha
 * @license Apache-2.0
 * 
 * ⚠️ WORK IN PROGRESS - REFERENCE IMPLEMENTATION ONLY ⚠️
 * 
 * This UMD build supports:
 * - CommonJS (Node.js require)
 * - AMD (RequireJS)
 * - Global variable (browser window.PartiallyHostedUIComponent)
 * 
 * For modern ES modules, use partially-hosted-ui-component.mjs instead.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD (RequireJS)
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS (Node.js)
    module.exports = factory();
  } else {
    // Browser globals
    root.PartiallyHostedUIComponent = factory();
    // Also provide shorter alias
    root.PartiallyHostedUI = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Import the full implementation from the ES module version
  // This file contains the same implementation as partially-hosted-ui-component.mjs
  // but wrapped in UMD for broader compatibility

  // Constants
  const DEFAULT_BASE_URL = 'https://onboarding.jpmorgan.com';
  const DEFAULT_EXPERIENCE_TYPE = 'HOSTED_DOC_UPLOAD_ONBOARDING_UI';
  const MOUNT_DELAY_MS = 100;
  const REFRESH_DELAY_MS = 100;

  // Enums
  const ExperienceType = {
    HOSTED_DOC_UPLOAD_ONBOARDING_UI: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
  };

  const EventNamespace = {
    LIFECYCLE: 'lifecycle',
    ONBOARDING: 'onboarding',
    SESSION: 'session',
    ERROR: 'error',
    DEBUG: 'debug',
  };

  const EventLevel = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    DEBUG: 'debug',
  };

  // Helper functions
  function encodeJsonParam(obj) {
    if (!obj || typeof obj !== 'object') return '';
    try {
      return encodeURIComponent(JSON.stringify(obj));
    } catch (error) {
      console.error('[PartiallyHostedUIComponent] Failed to encode JSON parameter:', error);
      return '';
    }
  }

  function buildIframeUrl(config) {
    const {
      baseUrl = DEFAULT_BASE_URL,
      sessionToken,
      experienceType = DEFAULT_EXPERIENCE_TYPE,
      theme,
      contentTokens,
    } = config;

    const params = new URLSearchParams({
      token: sessionToken,
      experienceType: experienceType,
    });

    if (theme) {
      const encodedTheme = encodeJsonParam(theme);
      if (encodedTheme) params.append('theme', encodedTheme);
    }

    if (contentTokens) {
      const encodedTokens = encodeJsonParam(contentTokens);
      if (encodedTokens) params.append('contentTokens', encodedTokens);
    }

    return `${baseUrl}/onboarding?${params.toString()}`;
  }

  function createIframe(url, customAttributes) {
    customAttributes = customAttributes || {};
    const iframe = document.createElement('iframe');
    
    iframe.src = url;
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.setAttribute('title', 'Complete your account onboarding - interactive form');
    iframe.setAttribute('aria-label', 'Onboarding application iframe');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals');
    
    Object.keys(customAttributes).forEach(function(key) {
      const value = customAttributes[key];
      if (value === true) {
        iframe.setAttribute(key, '');
      } else if (value !== false && value !== null && value !== undefined) {
        iframe.setAttribute(key, String(value));
      }
    });

    return iframe;
  }

  function isValidOrigin(eventOrigin, expectedBaseUrl) {
    try {
      const eventUrl = new URL(eventOrigin);
      const expectedUrl = new URL(expectedBaseUrl);
      return eventUrl.protocol === expectedUrl.protocol && eventUrl.hostname === expectedUrl.hostname;
    } catch (error) {
      console.error('[PartiallyHostedUIComponent] Invalid URL in origin validation:', error);
      return false;
    }
  }

  // Main class
  function PartiallyHostedUIComponent(config) {
    config = config || {};

    if (!config.sessionToken) {
      throw new Error('[PartiallyHostedUIComponent] sessionToken is required in configuration');
    }

    this.config = {
      baseUrl: DEFAULT_BASE_URL,
      experienceType: DEFAULT_EXPERIENCE_TYPE
    };
    
    // Merge config
    for (var key in config) {
      if (config.hasOwnProperty(key)) {
        this.config[key] = config[key];
      }
    }

    this.iframe = null;
    this.targetElement = null;
    this.subscribers = [];
    this.messageHandler = this._handleMessage.bind(this);
    this.isMounted = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.messageHandler);
    }

    this._log('debug', 'PartiallyHostedUIComponent initialized', {
      experienceType: this.config.experienceType,
      hasTheme: !!this.config.theme,
      hasContentTokens: !!this.config.contentTokens,
    });
  }

  // Prototype methods
  PartiallyHostedUIComponent.prototype.mount = function(targetElementId) {
    if (!targetElementId || typeof targetElementId !== 'string') {
      throw new Error('[PartiallyHostedUIComponent] targetElementId must be a non-empty string');
    }

    if (this.isMounted) {
      throw new Error('[PartiallyHostedUIComponent] Component is already mounted. Call unmount() first.');
    }

    this.targetElement = document.getElementById(targetElementId);

    if (!this.targetElement) {
      throw new Error('[PartiallyHostedUIComponent] Could not find element with ID: ' + targetElementId);
    }

    var self = this;
    setTimeout(function() {
      try {
        var iframeUrl = buildIframeUrl(self.config);
        self._log('debug', 'Built iframe URL', {
          url: iframeUrl.replace(/token=[^&]*/, 'token=REDACTED'),
        });

        self.iframe = createIframe(iframeUrl, self.config.iframeAttributes || {});

        self.iframe.addEventListener('load', function() {
          self._log('info', 'Iframe loaded successfully');
          self._publish({
            level: EventLevel.INFO,
            namespace: EventNamespace.LIFECYCLE,
            message: 'IframeLoaded',
            payload: { timestamp: Date.now(), targetElementId: targetElementId },
          });
        });

        self.iframe.addEventListener('error', function(error) {
          self._log('error', 'Iframe load error', error);
          self._publish({
            level: EventLevel.ERROR,
            namespace: EventNamespace.LIFECYCLE,
            message: 'IframeLoadError',
            payload: { error: error.message || 'Unknown error', timestamp: Date.now() },
          });
        });

        self.targetElement.appendChild(self.iframe);
        self.isMounted = true;

        self._publish({
          level: EventLevel.INFO,
          namespace: EventNamespace.LIFECYCLE,
          message: 'Mounted',
          payload: { targetElementId: targetElementId, experienceType: self.config.experienceType, timestamp: Date.now() },
        });

        self._log('info', 'Component mounted successfully', { targetElementId: targetElementId });
      } catch (error) {
        self._log('error', 'Mount failed', error);
        throw error;
      }
    }, MOUNT_DELAY_MS);
  };

  PartiallyHostedUIComponent.prototype.unmount = function() {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }

    this.iframe = null;
    this.targetElement = null;
    this.isMounted = false;

    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageHandler);
    }

    this._publish({
      level: EventLevel.INFO,
      namespace: EventNamespace.LIFECYCLE,
      message: 'Unmounted',
      payload: { timestamp: Date.now() },
    });

    this._log('info', 'Component unmounted');
  };

  PartiallyHostedUIComponent.prototype.subscribe = function(callback) {
    if (typeof callback !== 'function') {
      throw new Error('[PartiallyHostedUIComponent] Subscribe callback must be a function');
    }

    this.subscribers.push(callback);
    this._log('debug', 'Subscriber added', { totalSubscribers: this.subscribers.length });

    var self = this;
    return function unsubscribe() {
      var index = self.subscribers.indexOf(callback);
      if (index > -1) {
        self.subscribers.splice(index, 1);
        self._log('debug', 'Subscriber removed', { totalSubscribers: self.subscribers.length });
      }
    };
  };

  PartiallyHostedUIComponent.prototype.updateTheme = function(theme) {
    if (!this.isMounted) {
      throw new Error('[PartiallyHostedUIComponent] Cannot update theme: component is not mounted');
    }

    this.config.theme = this.config.theme || {};
    for (var key in theme) {
      if (theme.hasOwnProperty(key)) {
        this.config.theme[key] = theme[key];
      }
    }

    this._log('info', 'Theme updated, refreshing iframe');
    this.refresh();
  };

  PartiallyHostedUIComponent.prototype.updateContentTokens = function(contentTokens) {
    if (!this.isMounted) {
      throw new Error('[PartiallyHostedUIComponent] Cannot update content tokens: component is not mounted');
    }

    this.config.contentTokens = this.config.contentTokens || {};
    for (var key in contentTokens) {
      if (contentTokens.hasOwnProperty(key)) {
        this.config.contentTokens[key] = contentTokens[key];
      }
    }

    this._log('info', 'Content tokens updated, refreshing iframe');
    this.refresh();
  };

  PartiallyHostedUIComponent.prototype.refresh = function() {
    if (!this.iframe || !this.targetElement) {
      throw new Error('[PartiallyHostedUIComponent] Cannot refresh: component is not mounted');
    }

    var targetId = this.targetElement.id;
    this._log('info', 'Refreshing component');
    this.unmount();

    var self = this;
    setTimeout(function() {
      self.mount(targetId);
    }, REFRESH_DELAY_MS);
  };

  PartiallyHostedUIComponent.prototype.getState = function() {
    return {
      isMounted: this.isMounted,
      targetElementId: this.targetElement ? this.targetElement.id : null,
      experienceType: this.config.experienceType,
      hasTheme: !!this.config.theme,
      hasContentTokens: !!this.config.contentTokens,
      subscriberCount: this.subscribers.length,
    };
  };

  PartiallyHostedUIComponent.prototype._handleMessage = function(event) {
    var allowedOrigin = this.config.baseUrl || DEFAULT_BASE_URL;
    
    if (!isValidOrigin(event.origin, allowedOrigin)) {
      this._log('warning', 'Rejected postMessage from invalid origin', {
        receivedOrigin: event.origin,
        expectedOrigin: allowedOrigin,
      });
      return;
    }

    if (!event.data || typeof event.data !== 'object') {
      this._log('warning', 'Received invalid postMessage data', { data: event.data });
      return;
    }

    this._log('debug', 'Received postMessage', {
      namespace: event.data.namespace,
      message: event.data.message,
      level: event.data.level,
    });

    this._publish(event.data);
  };

  PartiallyHostedUIComponent.prototype._publish = function(eventData) {
    for (var i = 0; i < this.subscribers.length; i++) {
      try {
        this.subscribers[i](eventData);
      } catch (error) {
        console.error('[PartiallyHostedUIComponent] Error in subscriber callback:', error);
      }
    }
  };

  PartiallyHostedUIComponent.prototype._log = function(level, message, data) {
    var prefix = '[PartiallyHostedUIComponent]';
    
    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'warning':
        console.warn(prefix, message, data || '');
        break;
      case 'debug':
        if (this.config.debug) {
          console.log(prefix, '[DEBUG]', message, data || '');
        }
        break;
      case 'info':
      default:
        console.log(prefix, message, data || '');
    }
  };

  PartiallyHostedUIComponent.prototype.destroy = function() {
    this.unmount();
    this.subscribers = [];
    this.config = null;
    this._log('info', 'Component destroyed');
  };

  // Static properties
  PartiallyHostedUIComponent.VERSION = '1.0.0-alpha';
  PartiallyHostedUIComponent.ExperienceType = ExperienceType;
  PartiallyHostedUIComponent.EventNamespace = EventNamespace;
  PartiallyHostedUIComponent.EventLevel = EventLevel;

  // Return the constructor
  return PartiallyHostedUIComponent;
}));
