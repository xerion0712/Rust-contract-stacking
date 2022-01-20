import {Commitment, Connection, ConnectionConfig} from '@solana/web3.js';

export enum SolanaNet {
  MAINNET = 'mainnet',
  DEVNET = 'devnet',
  LOCALNET = 'localnet',
}

class NetConfig {
  connectionString: string;
  commitment: Commitment;

  constructor(connectionString: string, commitment: Commitment) {
    this.connectionString = connectionString;
    this.commitment = commitment;
  }

  getConnectionConfig(): ConnectionConfig {
    return {
      commitment: this.commitment,
    };
  }
}

class MainNetConfig extends NetConfig {
  static readonly connectionString = '';
  static readonly commitment = 'processed' as Commitment;

  constructor() {
    super(MainNetConfig.connectionString, MainNetConfig.commitment);
  }
}

class DevNetConfig extends NetConfig {
  static readonly connectionString = '';
  static readonly commitment = 'processed' as Commitment;

  constructor() {
    super(DevNetConfig.connectionString, DevNetConfig.commitment);
  }
}

class LocalNetConfig extends NetConfig {
  static readonly connectionString = 'http://127.0.0.1:8899';
  static readonly commitment = 'processed' as Commitment;

  constructor() {
    super(LocalNetConfig.connectionString, LocalNetConfig.commitment);
  }
}

/**
 * Service used to create and manage global connection configurations
 */
export class ConnectionService {
  protected static _connectionString?: string = undefined;
  protected static _config?: ConnectionConfig | Commitment = undefined;
  protected static _net?: SolanaNet;

  static setNet(net: SolanaNet) {
    this._net = net;
    let config: NetConfig;
    switch (net) {
      case SolanaNet.MAINNET:
        config = new MainNetConfig();
        break;
      case SolanaNet.DEVNET:
        config = new DevNetConfig();
        break;
      case SolanaNet.LOCALNET:
        config = new LocalNetConfig();
        break;
      default:
        throw new Error('Not a valid net');
    }

    this.setConfig(config.connectionString, config.getConnectionConfig());
  }

  static getNet(): SolanaNet | undefined {
    return this._net;
  }

  /**
   * Set the global connection config
   * @param connectionString connection string (set this to what cluster you want to connect to)
   * @param config connection configs
   */
  static setConfig(connectionString: string, config: ConnectionConfig): void {
    this._connectionString = connectionString;
    this._config = config;
  }

  /**
   * @returns a fresh connection with the current connection configs
   */
  static getConnection(): Connection {
    return new Connection(this.getConnectionString(), this.getConfig());
  }

  /**
   * @returns the stored connection string
   */
  static getConnectionString(): string {
    if (!this._connectionString) {
      throw new Error('Connection string not initialized');
    }

    return this._connectionString;
  }

  /**
   * @returns the stored connection config
   */
  static getConfig(): ConnectionConfig | Commitment | undefined {
    return this._config;
  }
}
