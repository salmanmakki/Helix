declare namespace google {
  namespace accounts {
    namespace id {
      interface CredentialResponse {
        credential: string;
      }
      interface IdConfiguration {
        client_id: string;
        callback: (response: CredentialResponse) => void;
      }
      function initialize(config: IdConfiguration): void;
      function renderButton(
        parent: HTMLElement,
        options: {
          theme?: string;
          size?: string;
          width?: string | number;
          text?: string;
          shape?: string;
        }
      ): void;
    }
    namespace oauth2 {
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: { id_token?: string; error?: string }) => void;
      }
      interface TokenClient {
        requestAccessToken(options?: { prompt?: string }): void;
      }
      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}
