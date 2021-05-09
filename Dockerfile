FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Create directory for files
RUN mkdir UserData

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Start service
CMD [ "node", "index.js" ]
