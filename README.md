# Chappai

[![Build Status](https://travis-ci.org/Digipolitan/chappai.svg)](https://travis-ci.org/Digipolitan/chappai)
[![Test Coverage](https://codeclimate.com/github/Digipolitan/chappai/badges/coverage.svg)](https://codeclimate.com/github/Digipolitan/chappai/coverage)

In a Micro-Service Architecture, you have to handle the proxying, the load, and at least failures.
One of the mandatory component is a `Gateway`.

The main goal of a `Gateway` is to keep track of all services registered,
to authorize or not a user to access requested services, and if needed,
to render data to fit with clients needs.

With **Chappai** (pronounced "Cha-Pa-Eye") you can monitor services, register you APIs and define custom data renders.

The registry part is handled by another library called [**Yemma**](https://github.com/Digipolitan/yemma).
Feel free to checkout this project documentation to know more about the registry.

### Setup

- In a classic nodeJS project, install the dependency.

 ```bash
 npm i --save chappai
 ```

- In your main nodeJS file application (typically index.js) use it like so :

 ```javascript
 const gateway = require('chappai');

 gateway
     .on(started, app => console.log(`Gateway listening on port ${app.settings.port}`))
     .start();
 ```

- Setup your environment:

 ```bash
 export YEMMA_DB_URI=mongodb://localhost:27017/yemma
 export YEMMA_PORT=9000
 export PORT=6473
 # Mandatory(*) For Authentication part
 export AUTH_REALM=auth
 export AUTH_PATH=/api/v1/users/profile
 export AUTH_HEADER=authorization
 # Optional(*) For Access Control part
 export ACCESS_REALM=access
```


### Reference
[Chappai](https://en.wikipedia.org/wiki/Stargate_(device)) is the name of the stargate in the goa'uld language.
