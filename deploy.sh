#!/usr/bin/env bash

echo "pulling latest version of the code"
ssh $DEPLOY_USER@$DEPLOY_HOST 'docker pull jlevine22/man-blog'

echo "restarting the container"
ssh $DEPLOY_USER@$DEPLOY_HOST '~/reload_man_blog'
echo "success!"

exit 0