FROM node
WORKDIR /app
COPY package*.json /app
RUN npm ci --only=production && npm cache clean --force
COPY . /app

EXPOSE 8080
CMD [ "node", "app.js" ]
