FROM node:16

RUN mkdir /home/node/group-car-api
RUN mkdir /home/node/group-car-api/node_modules
RUN chown -R node:node /home/node/group-car-api

WORKDIR /home/node/group-car-api

COPY package.json ./
COPY yarn.lock ./

RUN apt-get update
RUN apt-get install libpango1.0-dev gir1.2-pango-1.0 libcairo2-dev libcairo-gobject2 gobject-introspection libgirepository1.0-dev libxml2-dev -y

RUN npm_config_build_from_source=true yarn add canvas
RUN yarn install

COPY --chown=node:node . .

RUN yarn tsc

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "-r", "tsconfig-paths/register", "./build/group-car.js"]