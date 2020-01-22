FROM node:12.14.1-alpine3.9

RUN addgroup -S app && adduser -S -G app app

RUN mkdir /app
WORKDIR /app
COPY app package.json package-lock.json tsconfig.json jest.config.js ./
RUN npm install
RUN npm run build 


USER app

ENTRYPOINT [ "node", "build/main.js" ]