# Installation

The intention of this guide is to walk you through the steps of installing ReviewNinja
on your own server. The most common scenario for installing ReviewNinja is to have
a local version available behind a corporate firewall, connected to your GitHub
Enterprise (GHE) instance.

This guide assumes you are installing a ReviewNinja from scratch on a unix based
machine. You may be able to skip some of the components described below if you
already have such a service available to you.

## Prerequisites

### MongoDB

ReviewNinja uses a [Mongo database](https://www.mongodb.org/) for data persistance. See
the [installation guide](https://docs.mongodb.org/manual/installation/) to install 
MondoDB on your server.

### Node

ReviewNinja is a [Node](https://nodejs.org/) application. 
[Download and install](https://nodejs.org/en/download/) node on your machine, this will
also install the [NPM package manager](https://www.npmjs.com/).

### Nginx (optional)

The suggested deployment strategy for node applications is to install an
[nginx](http://nginx.org/) server in front of the node server to reverse proxy to
your node application. This is useful for enabling ReviewNinja over https.

## Install ReviewNinja

Once these components are installed we are ready to install ReviewNinja.

**1) Clone this repository**
```
git clone https://github.com/reviewninja/review.ninja.git /app
```

**2) Execute npm install**
```
cd /app
npm install
```
Ensure that `bower install` has also been executed as part of the post-install script.

**3) Create a [developer application](https://github.com/settings/applications/new)**

Be sure to create the application **on your GHE instance**. You may create 
this under your personal username or under an organization.

Assuming ReviewNinja will be hosted at `https://reviewninja.company.com`, you would set 
the homepage and callback URL as such:

```
homepage: https://reviewninja.company.com
callback: https://reviewninja.company.com/auth/github/callback
```

Copy and paste the generated client ID and secret into the `.env` file as described below.

**4) Configure your local environment**

Create a file in the root of the ReviewNinja folder called `.env`.

Assuming the following:
- you are running mongo locally,
- your GHE domain is `https://github.company.com`, and
- you will enable ReviewNinja over https via nginx

Your `.env` file may look something like this:

```
# MongoDB Settings
export MONGODB=mongodb://127.0.0.1/reviewninja

# Client ID and Secret of your GitHub Application (described above)
export GITHUB_CLIENT=xxx
export GITHUB_SECRET=xxx

# Node.js Environment
export NODE_ENV=production

# ReviewNinja server settings
export PROTOCOL=https
export HOST=reviewninja.company.com

# GitHub server settings
export GITHUB_PROTOCOL=https
export GITHUB_HOST=github.company.com
export GITHUB_API_HOST=github.company.com
export GITHUB_API_PATHPREFIX=/api/v3

# Custom certificates
export CERT=/certs/*
```

Please ensure that your GHE API is reachable at `https://github.company.com/api/v3/`.
Alternatively, it *may* be located at `https://api.github.company.com`. If neither of 
these options work you should contact the administrator of your GHE instance.

For a complete list of supported configuration options see 
[our .env.example](https://github.com/reviewninja/review.ninja/blob/master/.env.example).

If you have custom SSL certificates that are required to verify requests to your 
GHE instance, make sure to upload them to the server and specify the location of these
in your env file.

**5) Install forever**
```
npm install -g forever
```

Forever manages node processes to ensure they are restarted on crashes.

**6) Start ReviewNinja**
```
source .env
forever start app.js
```

## Define the Nginx Server

If you want to reverse proxy to the application server, you will need to define an
nginx server to do so. This guide assumes ReviewNinja is reachable over https at
`https://reviewninja.company.com`, and you have generated ssl `crt` and `key`
files.

Create `reviewninja.company.com.conf` and place in the correct nginx folder
(usually `/etc/nginx/sites-enabled`). Make sure to restart nginx.
```
upstream app_server {
    server 127.0.0.1:5000 fail_timeout=0;
}

server {
    listen 443 ssl;
    server_name reviewninja.company.com;
    server_tokens off; # don't show the version number, a security best practice

    ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers AES128-SHA:AES256-SHA:RC4-SHA:DES-CBC3-SHA:RC4-MD5;
    ssl_certificate /etc/nginx/certs/reviewninja.crt;
    ssl_certificate_key /etc/nginx/certs/reviewninja.key; 

    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;

        if (!-f $request_filename) {
            proxy_pass http://app_server;
            break;
        }
    }
}
```
