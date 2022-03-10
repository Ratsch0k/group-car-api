import {JWTConfig} from './jwt-config';
import {Config as SequelizeConfig} from 'sequelize/types';

export interface AuthConfig {
  saltRounds: number;
  waitOnLogin: number;
}

export interface StaticConfig {
  path: string;
  disabled: boolean;
}

export interface ErrorConfig {
  withStack: boolean;
}

export interface DBConfig {
  sequelize: SequelizeConfig;
  withFlush: boolean;
}

export interface MorganConfig {
  formatString: string | null;
}

export interface PbConfig {
  dimensions: number;
}

export interface UserConfig {
  pb: PbConfig;
  signUpThroughRequest: boolean;
  maxLimitQuery: number;
  maxUsernameLength: number;
}

export interface GroupConfig {
  maxMembers: number;
  maxCars: number;
}

export interface MailConfig {
  accountRequest: {
    type?: string;
    options: {
      service?: string;
      host?: string;
      port?: string;
      auth?: {
        user?: string;
        pass?: string;
      };
    }
    receiver?: string;
  }
}

export interface MetricsConfig {
  enabled: boolean;
  tracesSampleRate: number;
  dsn: string;
}

export interface Config {
  database: DBConfig;
  auth: AuthConfig;
  static: StaticConfig;
  error: ErrorConfig;
  jwt: JWTConfig;
  morgan: MorganConfig;
  user: UserConfig;
  serverType: string;
  group: GroupConfig;
  mail: MailConfig;
  metrics: MetricsConfig;
}