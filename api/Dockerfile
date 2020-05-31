FROM node:lts-alpine AS compiler
WORKDIR /usr/src/api
COPY . .
RUN yarn
RUN yarn build

FROM node:lts-alpine
WORKDIR /usr/bin/api
COPY package.json .
COPY yarn.lock .
COPY --from=compiler /usr/src/api/dist/ dist
RUN yarn install --production
CMD ["yarn", "start"]