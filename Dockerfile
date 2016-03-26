FROM node:5.8

# Install app dependencies
COPY . /src
RUN cd /src; npm install

# Bundle app source
#COPY ./src /man-blog/src
#COPY ./public /man-blog/public
#COPY ./tests /man-blog/tests
#
#EXPOSE 3000
#CMD ["node", "/man-blog/src/app.js"]

#docker run --name man-blog -v /cache -v "/home/josh/Dropbox/Manly Blog Posts":/posts -p 3000:3000 jlevine22/man-blog