[![Build Status](https://travis-ci.com/Ratsch0k/group-car-api.svg?token=VoTpURfdRAcYtA5D82Re&branch=master)](https://travis-ci.com/Ratsch0k/group-car-api)
[![Dev Coverage](https://dev.my-group-car.de/test/coverage/badge/badge.svg)](https://dev.my-group-car.de/test/coverage)
[![Beta Coverage](https://beta.my-group-car.de/test/coverage/badge/badge.svg)](https://beta.my-group-car.de/test/coverage)
# Group Car Api 
## Backend api for the webapp Group Car

--------

### Create Groups for better and easier usage of a shared car 
Know exactly where to find your car, even if it was used by others

Share you car's location with your family or group with a single press of a button

--------

Source Code of the backend for website www.my-group-car.de

Used Technologies:
  - Managment
    + GitHub
    + Travis CI
  - Frontend
    + (OAuth2.0)
    + React.js with Typescript
    + Material Design
  - Backend
    + Node.js / Express.js with Typescript
    + Nginx
    + Postgresql

---
## Server urls
Every url which is not listed below will route the frontend
 - `/doc/openapi`: Openapi / Swagger documentation
 - `/doc/typedoc`: Code documentation via typedoc
 - `/test`: Test report
 - `/test/coverage`: Test coverage report
---
## How to run
The server can run in the following configurations:
  - `yarn dev` ts-node is used to run the typescript code. Only http request and database operations are logged
  - `yarn dev:log` ts-node is used to run typescript code. Http request, database operations and logging of server code is enabled
  - `yarn dev:log:all` ts-node is used to run typescript code. Every type of logging is enabled
  - `yarn prod` Typescript code is compiled into javascript code and saved in the subdirectory `build` the the javascript code is executed (recommended for production)

Configuration can be changed in `app/config` and in the `package.json`.

The server needs the following environment variables to fully function:
- **JWT_SECRET**: a cryptographically save secret to sign json web tokens
- **NODE_ENV**: the modus in which the server should run (default is development)

Optional environment variables:
 - **HTML_STATIC**: Path to the frontend which will served on every url which is not directly served by the backend, if not set the field `config.public` in the `package.json` is 
 - **PORT**: Port on which the server should listen, if not set the field `config.port` in the ´package.json` is used

### Command line options
`--allowSignUp`: The server will usually only allow sign up via a *SignUp Request*. This options allows a direct sign up

`--flush`: Flushes the database on every start. Flushing empties all tables.

`--disableStaticServer`: Disables serving of static files from the static directory (or if any other folder if specified)

### Database
The server can run without a connection to a database, but only static serving is fully functioning as almost everything else needs a database.\
The database connection can be configured in the file [app/config/database-config.js](https://github.com/Ratsch0k/group-car-api/blob/master/app/config/database-config.js).
When running in **production** or **development** the config takes the following environment variables for the connection:
- **DB_USERNAME**: User for the database
- **DB_PASSWORD**: Password for the user above
- **DB_NAME**: Name of the database
- **DB_HOSTNAME**: Hostname to the database

Because the library [sequlize](https://www.npmjs.com/package/sequelize) is used, every supported type of database management system can be used.

#### Migrations
The used library [sequlize](https://www.npmjs.com/package/sequelize) also supports migrations which helps implementing changes to an already existing schema and helps to seed a database with predefined data.\
Migrations can be found under `app/db/migrations`\
Seeders can be found unser `app/db/seeder`\

To use these you'll have to use [sequelize-cli](https://www.npmjs.com/package/sequelize-cli) (will use `database-config.js` to connect to the database)

---

## How to test
### Unit testing:
Unit tests can be started with
```
yarn test:unit
```

### Integration testing
Integration tests can be started with:
```
yarn test:integration
```
**Note:** Integration tests need a database connection

### Code Coverage and test report
A test report and coverage report can be created with
```
yarn coverage
```
This will run all unit and integration tests, store the coverage report under
`static/test/coverage` and the test report under `static/test` in form of html.
Both reports can be accessed if the server is running with:
- Coverage `/test/coverage`
- Test report `/test`

Author:
  - Ratsch0k
