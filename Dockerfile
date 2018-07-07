FROM node:carbon

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install
# RUN npm install --only=production

# Bundle app source
COPY . .

# this is part of the docker-compose
#EXPOSE 3000
#CMD [ "npm", "start" ]
