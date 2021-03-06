## About

This project is apart of my Computer Science course and is the final programming assessment.
The task is to create a web or desktop game that supports multiplayer.
I have decided to create a FPS game working with [Three.JS](https://github.com/mrdoob/three.js).
I am taking heavy inspiration from CS:GO for this project.

[Planning document](https://docs.google.com/document/d/1TK5HlipziA2nSvrkaUz8Xi36uU8StKVAvU3BXdNLBgE/)


## Authors

- [@s3ansh33p](https://www.github.com/s3ansh33p)

  
## Demo

https://dev.seanmcginty.space

  
## Documentation

[Documentation (generated with JSDoc)](https://dev.seanmcginty.space/docs)

  
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file. Some of the values that I use in my project we need to be changed to suit your configuration.

**FOMART:** `NAME` - my value for development

`MYSQL_HOST` - localhost

`MYSQL_DATABASE` - csc

`MYSQL_USERNAME` - root

`MYSQL_PASSWORD` - pass

`MYSQL_PORT` - 3309

`ENC_KEY` - crypto.randomBytes(16).toString('hex')

`ENC_IV` - crypto.randomBytes(16).toString('hex')

`EXPRESS_PORT` - 3000

`WS_PORT` - 8999

`NODE_ENV` - development


  
## Features

- Light/dark mode toggle
- Fullscreen mode
- Cross platform

  
## Feedback

If you have any feedback, please reach out to me at newfolderlocation@gmail.com

  
## License

[MIT](https://choosealicense.com/licenses/mit/)

## Optimizations

Todo: Websockets
## Roadmap

- More maps

- More weapons

- Skins

  
## Run Locally

Clone the project

```bash
  git clone https://github.com/s3ansh33p/Computer-Science-ATAR.git
```

Go to the project directory

```bash
  cd Computer-Science-ATAR
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

Note: I am running this on Linux RHEL 8 + NGINX so make sure that you have ssl configured if you are using the example .conf files. You can use certbot to get the letsencrypt certs.
```bash
  certbot certonly -d yourwebsite
  certbot certonly -d socket.yourwebsite
```

  
## Tech Stack

**Client:** ThreeJS, Bootstrap

**Server:** Node, Express, MySQL, NGINX

**Languages:** HTML, CSS, SCSS, JS, EJS, SQL
