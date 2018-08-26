FROM node:8.4

RUN mkdir /app
RUN mkdir /app/node_modules

WORKDIR /app

VOLUME /app
VOLUME /app/node_modules
