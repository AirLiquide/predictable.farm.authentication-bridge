## Predictable.Farm-Bridge ##

Node application used to proxy requests to the correct cloud environment.

Handle routing for http and websocket queries.

To be forwarded, a farm/user **MUST** be added to the database. At the moment there is no admin pannel, the user needs to be added from the terminal.

# Technologies

Based on NodeJS with :
 - <a href="http://expressjs.com/" target="_blank">Express</a> : http/https handling
 - <a href="https://github.com/nodejitsu/node-http-proxy" target="_blank">http-proxy</a> : http/https routing
 - <a href="https://github.com/OptimalBits/redbird" target="_blank">Redbird</a> : websocket routing

# Development environement
Run from source : `node index.js`

Run from docker : `docker run -p 80:80 -p 3000:3000 registry.gitlab.com/briceculas/predictable-farm-bridge`

**Ports** :
 - web : 8080
 - socket : 3000

# Production environement
Run from source : `node index.js`

Run from docker : `docker run -p 80:80 -p 3000:3000 -e NODE_ENV=prod registry.gitlab.com/briceculas/predictable-farm-bridge`

**Ports** :
 - web : 80
 - socket : 3000

Needs a mariaDB database to run, to handle cookies for http queries. You can find the default .sql files to use in the
docs.

# Database structure :
|  farm
| ------------- |
| farm_id      |
| farm_name       |
| address |
| secret_key |



|  user |
| ------------- |
| id_user      |
| name       |
| password_hash |
| password_salt|
| farm_id |


Documentation complète :  https://docs.google.com/document/d/1_SxayDKO30vMWrVTCxJiv7SGgChcJP5q2pF0UntlBh4/
