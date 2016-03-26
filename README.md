# MAN Blog

[![Circle CI](https://circleci.com/gh/jlevine22/MAN-Blog.svg?style=svg)](https://circleci.com/gh/jlevine22/MAN-Blog)

**A manly blogging platform built with:**
- Markdown
- Angular
- Node

MAN Blog is also designed to be run in a Docker container.

## Gulp Commands

```gulp build```
Builds a docker container for the app.

```gulp run```
Runs the docker container created from `gulp build`

```gulp test```
Runs the tests locally (not in the docker container)

```gulp new-post```
Create a skeleton blog post file. A series of guided prompts will help you create a new blog post file.

## Configuration
MAN Blog is designed to run with no further configuration. You will probably want to change some of the default 
settings though. MAN Blog can be configured using environment variables.

### Supported Values
- ```POSTS_DIRECTORY``` - (default: `/posts`) Path where post files are stored.
- ```CACHE_DIRECTORY``` - (default: `/cache`) Path where post files are rendered as html and cached.
- ```PORT``` - (default: `3000`) The port to listen on.
- ```HOST``` - (default: `localhost`) The host to bind to.

Typically you will not need to change any of these. For the posts and cache directory, you can mount these paths from
the local host to the docker container when you run it.

## Running the app in docker

The app can be run with a command that looks similar to this:

```
$ docker run --name man-blog -d -p 3000:3000 -v /path/to/posts:/posts -v /path/to/cache:/cache man-blog node /src/src/app.js
```

## Using Nginx to serve the app 
Create a vhost config file.

````
$ touch /etc/nginx/v.hosts/yourblogurl.com.conf 
````

Use the example config below to create your config file.

### Example Nginx Vhost Config

```
server {
    listen 80;
    server_name  yourblogurl.com www.yourblogurl.com;

    access_log  off;
    error_log off;
    
    # Serve the single page app for /p/post-slug urls
    rewrite ^/p/.*$ /index.html;

    # Catch requests starting with /posts and send them to the node app
    location ~ ^/(posts|tags) {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header        X-Real-IP       $remote_addr;
        proxy_set_header        Host            $host;
        proxy_redirect          off;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
        proxy_read_timeout 90;
        client_max_body_size 10m;
        client_body_buffer_size 128k;
        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
    }

    # Serve static files from the public directory
    location ~ ^/ {
        root /path/to/your/project/public;
        access_log off;
        expires max;
    }

    # Serve the cached markdown-to-html conversions
    location ~ ^/cache {
        root /path/to/cache/directory;
        access_log off;
        expires max;
    }
}
```
