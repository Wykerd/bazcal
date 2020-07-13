FROM node:lts AS compiler
WORKDIR /usr/src/scheduler
COPY . .
RUN yarn
RUN yarn build
RUN yarn build:bscript
# RUN yarn build:bscript:all

FROM node:lts
WORKDIR /usr/bin/api
COPY yarn.lock .
COPY *.json ./
COPY --from=compiler /usr/src/scheduler/dist/ dist
COPY --from=compiler /usr/src/scheduler/lib/ lib
# COPY --from=compiler /usr/src/scheduler/static/ static
RUN apt update
RUN mkdir cache
RUN apt install fonts-noto -y
RUN yarn install --production
CMD ["yarn", "start"]