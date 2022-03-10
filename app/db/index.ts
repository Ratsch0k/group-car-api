import {Sequelize} from 'sequelize';
import {Options} from 'sequelize';
import config from '@config';
import debug from 'debug';

const httpLog = debug('group-car:http');

/**
 * An extension of the {@link Sequelize} class which also
 * provides a simple promise based function to check
 * if the database is reachable or not.
 */
export class Database extends Sequelize {
  private username: string;
  private password : string;
  private options: Options | undefined;

  /**
   * Creates an instance of this object
   * @param database  Name of the database
   * @param username  Username for the database
   * @param password  Password for the user of the database
   * @param options   Optional options
   */
  constructor(database: string,
      username: string,
      password: string,
      options: Options | undefined) {
    super(database, username, password, options);
    this.username = username;
    this.password = password;
    this.options = options;
  }

  /**
   * Returns a promise which either resolves to true or false,
   * depending on if the database is reachable.
   * @returns A promise which resolves to true or false depending
   *          on the availability of the database
   */
  async isAvailable() {
    httpLog('Check connection to %s:%s', this.options!.host, this.options!.port);

    try {
      await this.authenticate();
      httpLog('Connection test successful');
      return true;
    } catch (e) {
      if (e !== undefined) {
        httpLog('Connection test failed because $s', e);
      } else {
        httpLog('Connection test failed');
      }
      return false;
    }
  }
}

const database = new Database(config.database.sequelize.database,
    config.database.sequelize.username,
    config.database.sequelize.password || '',
    config.database.sequelize as unknown as Options);

    // If currently in environment sync the database
let syncPromise: Promise<void>;
if (config.database.withFlush) {
  syncPromise = database.sync({force: true, logging: false}).then(() => {
    httpLog('Flushed database');
  });
} else {
  syncPromise = Promise.resolve();
}

export {
  syncPromise,
}

export default database;
