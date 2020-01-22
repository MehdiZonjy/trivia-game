FROM python:3.6.0-alpine

ENV PYTHONUNBUFFERED 1
ENV PYTHONFAULTHANDLER 1
ENV JSON_MAX_STACK_BUFFER_SIZE=1024

 


RUN addgroup -S app && adduser -S -G app app

RUN mkdir /app
WORKDIR /app

COPY client/app client/requirements.txt ./
RUN pip3 install --upgrade pip setuptools
RUN pip3 install -r requirements.txt 


USER app

ENTRYPOINT [ "python", "main.py" ]
