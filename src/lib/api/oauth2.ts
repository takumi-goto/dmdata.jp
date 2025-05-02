import { OAuth2Code } from '@dmdata/oauth2-client';
import { Settings } from '@/lib/db/settings';

const OAUTH_REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:4200/oauth/callback';
const PKCE_STORAGE_KEY = 'oauthPkceCodeVerifier';

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
  
  async savePkceCodeVerifier(codeVerifier: string) {
    await Settings.set(PKCE_STORAGE_KEY, codeVerifier);
  }
  
  async getPkceCodeVerifier(): Promise<string | null> {
    return await Settings.get(PKCE_STORAGE_KEY);
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
  
  async getAuthorizationUrl(): Promise<string> {
    if (!this.oauth2) {
      await this.init();
      if (!this.oauth2) {
        throw new Error('OAuth2 client initialization failed');
      }
    }
    
    const pkceCodeVerifier = window.crypto.randomUUID();
    await this.savePkceCodeVerifier(pkceCodeVerifier);
    
    const url = new URL('https://manager.dmdata.jp/account/oauth2/v1/auth');
    url.searchParams.set('client_id', 'CId.LgawSy4V1SNsimqooHFBiVNvLjdZtS1K5dJL6wyX5gfE');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('response_mode', 'query');
    url.searchParams.set('redirect_uri', OAUTH_REDIRECT_URI);
    url.searchParams.set('scope', 'contract.list parameter.earthquake socket.start telegram.list telegram.data telegram.get.earthquake gd.earthquake');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(pkceCodeVerifier);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const codeChallenge = btoa(String.fromCharCode.apply(null, hashArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    
    return url.toString();
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
      
      const pkceCodeVerifier = await this.getPkceCodeVerifier();
      console.log('Using stored PKCE code_verifier:', pkceCodeVerifier);
      
      if (!pkceCodeVerifier) {
        console.error('PKCE code verifier not found');
        return false;
      }
      
      try {
        console.log('Attempting token exchange using direct fetch...');
        
        const formData = new URLSearchParams();
        formData.append('grant_type', 'authorization_code');
        formData.append('code', code);
        formData.append('redirect_uri', OAUTH_REDIRECT_URI);
        formData.append('client_id', 'CId.LgawSy4V1SNsimqooHFBiVNvLjdZtS1K5dJL6wyX5gfE');
        formData.append('code_verifier', pkceCodeVerifier);
        
        const response = await fetch('https://manager.dmdata.jp/account/oauth2/v1/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });
        
        console.log('Token response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Token exchange error:', errorText);
          return false;
        }
        
        const tokenData = await response.json();
        console.log('Token response:', tokenData);
        
        if (tokenData && tokenData.refresh_token) {
          await Settings.set('oauthRefreshToken', tokenData.refresh_token);
          await this.init();
          
          const isAuthenticated = await this.refreshTokenCheck();
          return isAuthenticated;
        }
        
        console.error('No refresh token in response');
        return false;
      } catch (error) {
        console.error('Error during token exchange:', error);
        return false;
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
      dpop: oauthDPoPKeypair,
      waitingStart: false
    });

    this.refreshToken = refreshToken;

    this.oauth2.on('refresh_token', refreshToken => Settings.set('oauthRefreshToken', refreshToken))
      .on('dpop_keypair', keypair => Settings.set('oauthDPoPKeypair', keypair));
  }
}

export const oauth2Service = new Oauth2Service();
