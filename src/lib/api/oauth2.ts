import { OAuth2Code } from '@dmdata/oauth2-client';
import { Settings } from '@/lib/db/settings';

const OAUTH_REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:4200/oauth/callback';

class Oauth2Service {
  private oauth2?: OAuth2Code;
  private refreshToken?: string;

  constructor() {
    this.init();
  }

  async refreshTokenDelete() {
    await Settings.delete('oauthRefreshToken');
    this.refreshToken = undefined;
  }

  async oAuth2ClassReInit() {
    await this.init();
  }

  async getAuthorization(): Promise<string | null> {
    if (!this.oauth2) {
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(this.oauth2);
      if (!this.oauth2) {
        return this.getAuthorization();
      }
    }

    return this.oauth2.getAuthorization();
  }

  async getDPoPProofJWT(method: string, uri: string, nonce?: string | null) {
    return this.oauth2?.getDPoPProofJWT(method, uri, nonce) ?? null;
  }

  async refreshTokenCheck() {
    return !!(await Settings.get('oauthRefreshToken'));
  }

  async handleAuthorizationCode(code: string): Promise<boolean> {
    try {
      if (!this.oauth2) {
        await this.init();
        if (!this.oauth2) {
          console.error('OAuth2 client not initialized');
          return false;
        }
      }

      console.log('Exchanging authorization code for token...');
      console.log('Code:', code);
      console.log('Redirect URI:', OAUTH_REDIRECT_URI);
      
      console.log('OAuth2 client options before token exchange:', JSON.stringify({
        endpoint: (this.oauth2 as any).option?.endpoint,
        client: {
          id: (this.oauth2 as any).option?.client?.id,
          redirectUri: (this.oauth2 as any).option?.client?.redirectUri,
          scopes: (this.oauth2 as any).option?.client?.scopes
        },
        pkce: (this.oauth2 as any).option?.pkce,
        dpop: (this.oauth2 as any).option?.dpop
      }, null, 2));
      
      this.oauth2 = new OAuth2Code({
        endpoint: {
          authorization: 'https://manager.dmdata.jp/account/oauth2/v1/auth',
          token: 'https://manager.dmdata.jp/account/oauth2/v1/token',
          introspect: 'https://manager.dmdata.jp/account/oauth2/v1/introspect'
        },
        client: {
          id: 'CId.LgawSy4V1SNsimqooHFBiVNvLjdZtS1K5dJL6wyX5gfE',
          secret: '', // Explicitly set empty string for client secret
          scopes: ['contract.list', 'parameter.earthquake', 'socket.start', 'telegram.list', 'telegram.data', 'telegram.get.earthquake', 'gd.earthquake'],
          redirectUri: OAUTH_REDIRECT_URI
        },
        pkce: true,
        dpop: 'ES384'
      });

      try {
        console.log('Attempting token exchange using SDK...');
        const tokenData = await (this.oauth2 as any).authorizationAccessToken(code, null);
        console.log('SDK token exchange successful:', tokenData);
        
        if (tokenData && tokenData.refresh_token) {
          await Settings.set('oauthRefreshToken', tokenData.refresh_token);
          await this.init();
          
          const isAuthenticated = await this.refreshTokenCheck();
          return isAuthenticated;
        }
        
        console.error('No refresh token in SDK response:', tokenData);
        return false;
      } catch (sdkError) {
        console.error('SDK token exchange error:', sdkError);
        
        try {
          console.log('Falling back to direct fetch implementation...');
          const formData = new URLSearchParams();
          formData.append('grant_type', 'authorization_code');
          formData.append('code', code);
          formData.append('redirect_uri', OAUTH_REDIRECT_URI);
          
          formData.append('client_id', 'CId.LgawSy4V1SNsimqooHFBiVNvLjdZtS1K5dJL6wyX5gfE');
          
          const response = await fetch('https://manager.dmdata.jp/account/oauth2/v1/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
          });
          
          console.log('Token response status:', response.status);
          
          const tokenData = await response.json();
          console.log('Token response:', tokenData);
          
          if (tokenData && tokenData.refresh_token) {
            await Settings.set('oauthRefreshToken', tokenData.refresh_token);
            await this.init();
            
            const isAuthenticated = await this.refreshTokenCheck();
            return isAuthenticated;
          }
          
          console.error('No refresh token in response:', tokenData);
          return false;
        } catch (fetchError) {
          console.error('Error fetching token:', fetchError);
          return false;
        }
      }
    } catch (error) {
      console.error('Error handling authorization code:', error);
      return false;
    }
  }

  async init() {
    const refreshToken = await Settings.get('oauthRefreshToken');
    const oauthDPoPKeypair = await Settings.get('oauthDPoPKeypair') ? await Settings.get('oauthDPoPKeypair') : 'ES384';

    this.oauth2 = new OAuth2Code({
      endpoint: {
        authorization: 'https://manager.dmdata.jp/account/oauth2/v1/auth',
        token: 'https://manager.dmdata.jp/account/oauth2/v1/token',
        introspect: 'https://manager.dmdata.jp/account/oauth2/v1/introspect'
      },
      client: {
        id: 'CId.LgawSy4V1SNsimqooHFBiVNvLjdZtS1K5dJL6wyX5gfE',
        secret: '', // Explicitly set empty string for client secret
        scopes: ['contract.list', 'parameter.earthquake', 'socket.start', 'telegram.list', 'telegram.data', 'telegram.get.earthquake', 'gd.earthquake'],
        redirectUri: OAUTH_REDIRECT_URI
      },
      pkce: true,
      refreshToken,
      dpop: oauthDPoPKeypair
    });

    this.refreshToken = refreshToken;

    this.oauth2.on('refresh_token', refreshToken => Settings.set('oauthRefreshToken', refreshToken))
      .on('dpop_keypair', keypair => Settings.set('oauthDPoPKeypair', keypair));
  }
}

export const oauth2Service = new Oauth2Service();
