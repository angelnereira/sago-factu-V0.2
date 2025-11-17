import * as soap from 'soap';
import { HKACredentials, HKAEnvironment } from './types';

export class HKASOAPClient {
  private client: soap.Client | null = null;
  private wsdlUrl: string;
  private credentials: HKACredentials;
  private currentEnvironment: HKAEnvironment;
  private currentWsdlUrl: string;
  private injectedCredentials: HKACredentials | null = null;

  constructor() {
    // Inicializar con valores por defecto, se actualizarán en initialize()
    this.currentEnvironment = (process.env.HKA_ENV as HKAEnvironment) || 'demo';
    this.wsdlUrl = '';
    this.currentWsdlUrl = '';
    this.credentials = {
      tokenEmpresa: '',
      tokenPassword: '',
      usuario: '',
    };
  }

  /**
   * Inyecta credenciales específicas del usuario para esta solicitud
   * ✅ SEGURO: No modifica process.env, solo almacena localmente
   */
  injectCredentials(credentials: HKACredentials): void {
    console.log('[HKA] Inyectando credenciales específicas del usuario');
    this.injectedCredentials = credentials;
  }

  /**
   * Limpia las credenciales inyectadas
   */
  clearInjectedCredentials(): void {
    console.log('[HKA] Limpiando credenciales inyectadas');
    this.injectedCredentials = null;
  }

  /**
   * Actualiza la configuración según el ambiente actual
   */
  updateConfiguration(): void {
    const environment = (process.env.HKA_ENV as HKAEnvironment) || 'demo';
    
    // Si el ambiente cambió, necesitamos reinicializar
    const environmentChanged = this.currentEnvironment !== environment;
    
    // Calcular nueva URL WSDL
    const newWsdlUrl = environment === 'demo' 
      ? `${process.env.HKA_DEMO_SOAP_URL}?wsdl`
      : `${process.env.HKA_PROD_SOAP_URL}?wsdl`;

    // Si cambió el ambiente o la URL, reinicializar
    if (environmentChanged || this.currentWsdlUrl !== newWsdlUrl) {
      console.log(`🔄 Ambiente HKA cambió: ${this.currentEnvironment} → ${environment}`);
      console.log(`   WSDL URL: ${this.currentWsdlUrl} → ${newWsdlUrl}`);
      this.client = null; // Forzar reinicialización
    }

    this.currentEnvironment = environment;
    this.wsdlUrl = newWsdlUrl;
    this.currentWsdlUrl = newWsdlUrl;

    this.credentials = {
      tokenEmpresa: environment === 'demo'
        ? process.env.HKA_DEMO_TOKEN_USER || ''
        : process.env.HKA_PROD_TOKEN_USER || '',
      tokenPassword: environment === 'demo'
        ? process.env.HKA_DEMO_TOKEN_PASSWORD || ''
        : process.env.HKA_PROD_TOKEN_PASSWORD || '',
      usuario: environment === 'demo'
        ? process.env.HKA_DEMO_TOKEN_USER || ''
        : process.env.HKA_PROD_TOKEN_USER || '',
    };
  }

  /**
   * Inicializa el cliente SOAP
   */
  async initialize(): Promise<void> {
    // Actualizar configuración antes de inicializar
    this.updateConfiguration();

    if (this.client) return;

    try {
      this.client = await soap.createClientAsync(this.wsdlUrl, {
        // No forzar SOAP 1.2, usar SOAP 1.1 que es el estándar de HKA
        forceSoap12Headers: false,
        // 🔧 CRÍTICO: NO escapar XML automáticamente
        escapeXML: false,
        // Configuración de keys para XML anidado
        attributesKey: 'attributes',
        valueKey: '$value',
        xmlKey: '$xml',
        // Headers WSDL
        wsdl_headers: {
          'Accept-Encoding': 'gzip,deflate',
        },
      });

      // 🔍 DEBUGGING: Capturar requests para ver qué se envía
      this.client.on('request', (xml: string) => {
        console.log('📤 REQUEST XML enviado a HKA:');
        console.log(xml.substring(0, 1000)); // Primeros 1000 caracteres
      });

      this.client.on('response', (body: string) => {
        console.log('📥 RESPONSE de HKA (primeros 500 chars):');
        console.log(body.substring(0, 500));
      });

      console.log('✅ Cliente SOAP HKA inicializado correctamente');
      console.log('   WSDL URL:', this.wsdlUrl);
      console.log('   Usuario:', this.credentials.usuario);
      console.log('   escapeXML: false (XML sin escapar)');
    } catch (error) {
      console.error('❌ Error al inicializar cliente SOAP HKA:', error);
      throw error;
    }
  }

  /**
   * Obtiene el cliente SOAP inicializado
   */
  async getClient(): Promise<soap.Client> {
    if (!this.client) {
      await this.initialize();
    }
    return this.client!;
  }

  /**
   * Obtiene las credenciales configuradas
   *
   * Prioridad:
   * 1. Credenciales inyectadas (usuario específico)
   * 2. Credenciales del cliente (por defecto)
   */
  getCredentials(): HKACredentials {
    if (this.injectedCredentials) {
      return this.injectedCredentials;
    }
    return this.credentials;
  }

  /**
   * Lista los métodos disponibles en el WSDL
   */
  async listMethods(): Promise<string[]> {
    const client = await this.getClient();
    const description = client.describe();
    const methods: string[] = [];
    
    // Extraer nombres de métodos del descriptor
    for (const service in description) {
      for (const port in description[service]) {
        for (const method in description[service][port]) {
          methods.push(method);
        }
      }
    }
    
    return methods;
  }

  /**
   * Invoca un método del servicio SOAP con credenciales específicas
   * ✅ SEGURO: Inyecta credenciales de forma temporal sin modificar process.env
   */
  async invokeWithCredentials<T = any>(
    method: string,
    params: any,
    credentials: HKACredentials
  ): Promise<T> {
    try {
      // Inyectar credenciales del usuario
      this.injectCredentials(credentials);

      const client = await this.getClient();

      console.log(`📤 Invocando método HKA: ${method}`, {
        usuario: credentials.usuario,
        ambiente: credentials.environment,
      });

      // Primero intentar listar métodos disponibles si falla
      const methodAsync = `${method}Async`;

      if (typeof client[methodAsync] !== 'function') {
        console.error(`❌ Método ${methodAsync} no encontrado`);
        console.log('📋 Listando métodos disponibles...');
        const methods = await this.listMethods();
        console.log('   Métodos disponibles:', methods);
        const methodsStr = Array.isArray(methods) ? methods.join(', ') : String(methods);
        throw new Error(`Método ${methodAsync} no existe. Métodos disponibles: ${methodsStr}`);
      }

      const [result] = await client[methodAsync](params);

      console.log(`📥 Respuesta de HKA ${method}:`, {
        codigo: result?.dCodRes,
        mensaje: result?.dMsgRes,
      });

      return result;
    } catch (error) {
      console.error(`❌ Error al invocar método ${method}:`, error);
      throw error;
    } finally {
      // CRÍTICO: Limpiar credenciales inyectadas después de uso
      this.clearInjectedCredentials();
    }
  }

  /**
   * Invoca un método del servicio SOAP
   * ⚠️ DEPRECATED: Usar invokeWithCredentials() para aplicaciones multi-tenant
   */
  async invoke<T = any>(
    method: string,
    params: any
  ): Promise<T> {
    try {
      const client = await this.getClient();

      console.log(`📤 Invocando método HKA: ${method}`);

      // Primero intentar listar métodos disponibles si falla
      const methodAsync = `${method}Async`;

      if (typeof client[methodAsync] !== 'function') {
        console.error(`❌ Método ${methodAsync} no encontrado`);
        console.log('📋 Listando métodos disponibles...');
        const methods = await this.listMethods();
        console.log('   Métodos disponibles:', methods);
        const methodsStr = Array.isArray(methods) ? methods.join(', ') : String(methods);
        throw new Error(`Método ${methodAsync} no existe. Métodos disponibles: ${methodsStr}`);
      }

      const [result] = await client[methodAsync](params);

      console.log(`📥 Respuesta de HKA ${method}:`, {
        codigo: result?.dCodRes,
        mensaje: result?.dMsgRes,
      });

      return result;
    } catch (error) {
      console.error(`❌ Error al invocar método ${method}:`, error);
      throw error;
    }
  }
}

// Instancia singleton del cliente
let hkaClientInstance: HKASOAPClient | null = null;

export function getHKAClient(): HKASOAPClient {
  if (!hkaClientInstance) {
    hkaClientInstance = new HKASOAPClient();
  } else {
    // Forzar actualización de configuración en cada llamada
    // para asegurar que use el ambiente correcto
    hkaClientInstance.updateConfiguration();
  }
  return hkaClientInstance;
}

/**
 * Reinicia el cliente SOAP (útil cuando cambia el ambiente)
 */
export function resetHKAClient(): void {
  if (hkaClientInstance) {
    hkaClientInstance = null;
  }
}

