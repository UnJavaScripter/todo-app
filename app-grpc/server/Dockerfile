FROM node:16

WORKDIR /usr/src/app

COPY ./server/ ./
COPY ./protos/todo.proto ./

RUN npm install

EXPOSE 50051

CMD [ "node", "server.js" ]

# docker build -t server -f ./server/Dockerfile .
