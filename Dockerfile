FROM node:12

WORKDIR /usr/src/app

RUN apt-get update && apt-get install mysql-client -y

## Add the wait script to the image
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait