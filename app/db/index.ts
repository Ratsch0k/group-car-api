import {Sequelize} from 'sequelize';
type Options = import('sequelize').Options;
import config from '@config';
import debug from 'debug';

const log = debug('group-car-db');

/**
 * An extension of the {@link Sequelize} class which also
 * provides a simple promise based function to check
 * if the database is reachable or not.
 */
export class Database extends Sequelize {
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
  }

  /**
   * Returns a promise which either resolves to true or false,
   * depending on if the database is reachable.
   * @returns A promise which resolves to true or false depending
   *          on the availability of the database
   */
  isAvailable() {
    return this.authenticate().then(() => {
      return true;
    }).catch(() => {
      return false;
    });
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
    log('Synced database');
  });
} else {
  syncPromise = Promise.resolve();
}

export {
  syncPromise,
}

export default database;
