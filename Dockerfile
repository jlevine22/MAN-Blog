FROM node:5.8

# Install app dependencies
COPY . /src
RUN cd /src; npm install
RUN npm install -g gulp
RUN npm install -g mocha

WORKDIR /src