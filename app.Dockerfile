FROM node:12.14.1-alpine3.9

RUN apk --no-cache add \
      bash \
      curl \
      py-pip \
      jq \
      python &&\
    pip install --upgrade \
      pip \
      awscli &&\
    mkdir ~/.aws


RUN addgroup -S app && adduser -S -G app app

RUN mkdir /app
WORKDIR /app
COPY package.json bootstrap.sh package-lock.json tsconfig.json jest.config.js ./
RUN npm install
COPY app ./app
COPY test ./test
RUN npm run build 


USER app

ENTRYPOINT [ "bash", "-c", "bootstrap.sh; node build/app/main.js" ]