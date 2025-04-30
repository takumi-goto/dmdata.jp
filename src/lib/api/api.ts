import { DMDATA } from '@dmdata/sdk-js';
import { oauth2Service } from './oauth2';

class ApiService {
  private client: DMDATA;

  constructor() {
    try {
      this.client = new DMDATA();
      
      const originalAxios = (this.client as any).axios;
      if (originalAxios && originalAxios.interceptors && originalAxios.interceptors.response) {
        originalAxios.interceptors.response.use(
          (response: any) => {
            if (!response) {
              console.warn('Empty response received from API');
              return { data: null, status: 500, headers: {} };
            }
            return response;
          },
          (error: any) => {
            console.error('API request error:', error?.message);
            
            if (!error.response) {
              error.response = { 
                data: null, 
                status: error.status || 500,
                headers: {},
                url: error.config?.url || 'unknown'
              };
            }
            
            return Promise.reject(error);
          }
        );
      }
      
      this.client.setAuthorizationContext({
        getAuthorization: async () => {
          const auth = await oauth2Service.getAuthorization();
          return auth ?? '';
        },
        getDPoPProofJWT: (method: string, uri: string, nonce?: string | null) => oauth2Service.getDPoPProofJWT(method, uri, nonce)
      });
    } catch (error) {
      console.error('Error initializing DMDATA client:', error);
      this.client = new DMDATA(); // Fallback to a basic client
    }
  }

  async contractList() {
    try {
      const response = await this.client.contract.list();
      return response.data;
    } catch (error) {
      console.error('Error fetching contract list:', error);
      throw error;
    }
  }

  async telegramGet(tid: string) {
    try {
      const res = await this.client.telegramBody.get(tid);
      const contentType = res.headers['content-type'];

      if (contentType === 'application/json' && typeof res.data === 'object') {
        return res.data as object;
      }
      if (contentType === 'application/xml' && typeof res.data === 'string') {
        return new DOMParser().parseFromString(res.data, 'application/xml');
      }
      if (res.data === null || res.status !== 200 || typeof res.data !== 'string') {
        return res.status;
      }

      return res.data;
    } catch (error) {
      console.error('Error fetching telegram data:', error);
      throw error;
    }
  }

  async socketStart(classifications: any[], appName?: string, formatMode: 'json' | 'raw' = 'json') {
    try {
      const response = await this.client.socket.start({
        classifications,
        appName,
        formatMode
      });
      return response;
    } catch (error) {
      console.error('Error starting socket:', error);
      throw error;
    }
  }

  async telegramList(params: any) {
    try {
      const response = await this.client.telegram.list(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching telegram list:', error);
      throw error;
    }
  }

  async gdEarthquakeList(params: any) {
    try {
      const response = await this.client.gdEarthquake.list(params);
      return response.data;
    } catch (error) {
      console.error('Error fetching earthquake list:', error);
      throw error;
    }
  }

  async gdEarthquakeEvent(eventId: string) {
    try {
      const response = await this.client.gdEarthquake.event(eventId);
      return response.data;
    } catch (error) {
      console.error('Error fetching earthquake event:', error);
      throw error;
    }
  }

  async parameterEarthquakeStation() {
    try {
      const response = await this.client.parameter.earthquake();
      return response.data;
    } catch (error) {
      console.error('Error fetching earthquake station parameters:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
