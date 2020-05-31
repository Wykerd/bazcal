FROM node:lts-alpine AS compiler
WORKDIR /usr/src/scheduler
COPY . .
RUN yarn
RUN yarn build

FROM node:lts-alpine
WORKDIR /usr/bin/api
COPY package.json .
COPY yarn.lock .
COPY --from=compiler /usr/src/scheduler/dist/ dist
RUN yarn install --production
CMD ["yarn", "start"]