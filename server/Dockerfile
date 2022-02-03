FROM node:16

WORKDIR /usr/src/app

COPY server/package.json ./
COPY server/yarn.lock ./

RUN yarn
COPY server/. .
RUN yarn build

RUN mkdir dist/public
RUN chmod +w dist/public

ENV NODE_ENV production

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
USER node