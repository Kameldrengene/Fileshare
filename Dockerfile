FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install
RUN npm install -g nodemon

# Bundle app source
COPY . .

EXPOSE 3000

# Start service
CMD [ "nodemon", "node", "index.js" ]
