/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';

interface NotificationOptions {
  renotify?: boolean;
}

interface GoogleCredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

interface GooglePromptNotification {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
}

interface GoogleIdClient {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
  }) => void;
  prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
  disableAutoSelect?: () => void;
}

interface GoogleCodeClient {
  requestCode: () => void;
  __clientId?: string;
}

interface GoogleOauth2Client {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode?: string;
    callback: (response: { code?: string; error?: string }) => void;
    error_callback?: (err: { type?: string; message?: string }) => void;
  }) => GoogleCodeClient;
}

interface Window {
  google?: {
    accounts?: {
      id?: GoogleIdClient;
      oauth2?: GoogleOauth2Client;
    };
  };
}
