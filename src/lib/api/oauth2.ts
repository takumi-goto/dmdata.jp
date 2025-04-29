import { OAuth2Code } from '@dmdata/oauth2-client';
import { Settings } from '@/lib/db/settings';

const OAUTH_REDIRECT_URI = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || 'http://localhost:8080/oauth/callback';

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

  async init() {
    const refreshToken = await Settings.get('oauthRefreshToken');
    const oauthDPoPKeypair = await Settings.get('oauthDPoPKeypair') ? await Settings.get('oauthDPoPKeypair') : 'ES384';

    const customAuthorization = async (options: any) => {
      const url = new URL('https://manager.dmdata.jp/account/oauth2/v1/auth');
      const query = url.searchParams;
      
      query.set('client_id', 'CId.xyw6-lPflvaxR9CrGR-zHBfGJ_8dUmVtai_61qRSplwM');
      query.set('response_type', 'code');
      query.set('response_mode', 'query'); // Use 'query' instead of 'fragment'
      query.set('redirect_uri', OAUTH_REDIRECT_URI);
      
      if (options.state) {
        query.set('state', options.state);
      }
      
      if (options.codeChallenge) {
        query.set('code_challenge', options.codeChallenge);
        query.set('code_challenge_method', options.codeChallengeMethod || 'S256');
      }
      
      if (options.scopes && options.scopes.length > 0) {
        query.set('scope', options.scopes.join(' '));
      }
      
      return url.toString();
    };

    this.oauth2 = new OAuth2Code({
      endpoint: {
        authorization: 'https://manager.dmdata.jp/account/oauth2/v1/auth',
        token: 'https://manager.dmdata.jp/account/oauth2/v1/token',
        introspect: 'https://manager.dmdata.jp/account/oauth2/v1/introspect'
      },
      client: {
        id: 'CId.xyw6-lPflvaxR9CrGR-zHBfGJ_8dUmVtai_61qRSplwM',
        scopes: ['contract.list', 'parameter.earthquake', 'socket.start', 'telegram.list', 'telegram.data', 'telegram.get.earthquake', 'gd.earthquake'],
        redirectUri: OAUTH_REDIRECT_URI
      },
      pkce: true,
      refreshToken,
      dpop: oauthDPoPKeypair,
      customAuthorization
    });

    this.refreshToken = refreshToken;

    this.oauth2.on('refresh_token', refreshToken => Settings.set('oauthRefreshToken', refreshToken))
      .on('dpop_keypair', keypair => Settings.set('oauthDPoPKeypair', keypair));
  }
}

export const oauth2Service = new Oauth2Service();
