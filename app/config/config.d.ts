import {CookieOptions} from 'express';
import {Config as SequelizeConfig} from 'sequelize/types';

export interface SessionConfig {
  cookieName: string;
  sessionPrefix: string;
  absoluteTimeout: number;
  inactivityTimeout: number;
  cookieOptions: CookieOptions;
}

export interface AuthConfig {
  saltRounds: number;
  csrfTokenName: string;
  session: SessionConfig;
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

export interface RedisConfig {
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
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
  userPrefix: string;
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
  redis: RedisConfig;
  auth: AuthConfig;
  static: StaticConfig;
  error: ErrorConfig;
  morgan: MorganConfig;
  user: UserConfig;
  serverType: string;
  group: GroupConfig;
  mail: MailConfig;
  metrics: MetricsConfig;
}