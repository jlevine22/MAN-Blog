# MAN Blog

**A manly blogging platform built with:**
- Markdown
- Angular
- Node

## Gulp Commands

```gulp serve```
Serve the site for development.

```gulp new-post```
Create a skeleton blog post file. A series of guided prompts will help you create a new blog post file.

## Configuration
MAN Blog is designed to run with no further configuration. You will probably want to change some of the default settings though. MAN Blog is configured via a file called 'man.json' in the root directory of the project. You only need to set values you want to change the defaults for.

### Supported Values
- ```postsDirectory``` - Path where post files are stored. Defaults to the /posts directory in the project root.
- ```cacheDirectory``` - Path where post files are rendered as html and cached. Defaults to the /cache directory in the project root.
- ```githubPushUpdateEnabled``` - Enables the /github route for handling Github webhooks to pull new code when there are updates. Defaults to ```false```
- ```githubPushSecret``` - The secret key for the github webhook. Defaults to ```null```
- ```defaultAuthor``` - Sets a default value for the author field when running through the ```gulp new-post``` prompts. Defaults to ```null``` but the skeleton post generator will use 'Anonymous' if no default is set.
- ```port``` - The port to listen on. Defaults to 3000
- ```host``` - The host to bind to. Defaults to localhost


### Example man.json file

````
{
	"postsDirectory": "/path/to/posts",
	"defaultAuthor": "Malcolm Reynolds",
	"githubPushUpdateEnabled: true,
	"githubPushSecret": "secret password",
	"serveStatic": true,
	"port": 3000,
	"host": "localhost"
}
````

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
    location ~ ^/posts {
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
}
```
