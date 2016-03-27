#!/usr/bin/env bash

echo "pulling latest version of the code"
ssh $DEPLOY_USER@$DEPLOY_HOST 'docker pull jlevine22/man-blog'

echo "restarting the container"
ssh $DEPLOY_USER@$DEPLOY_HOST 'docker stop man-blog-web'
ssh $DEPLOY_USER@$DEPLOY_HOST 'docker rm man-blog-web'
ssh $DEPLOY_USER@$DEPLOY_HOST 'docker run --name man-blog-web --restart=always -d -p 3000:3000 -v "$DEPLOY_CACHE_DIR":/cache -v "$DEPLOY_POSTS_DIR":/posts jlevine22/man-blog node /src/src/app.js'

echo "success!"

exit 0