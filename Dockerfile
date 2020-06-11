FROM node:lts-alpine AS compiler
WORKDIR /usr/src/scheduler
COPY . .
RUN yarn
RUN yarn build
RUN yarn train

FROM node:lts-alpine
WORKDIR /usr/bin/api
COPY yarn.lock .
COPY *.json ./
COPY --from=compiler /usr/src/scheduler/dist/ dist
RUN yarn install --production
CMD ["yarn", "start"]