FROM node:12

WORKDIR /usr/src

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "."]
