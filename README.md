Predictable Farm — Authentication bridge
---

Node application used to proxy requests to the correct cloud environment.

Handle routing for http and websocket queries.

To be forwarded, a farm/user **MUST** be added to the database. At the moment there is no admin panel, the user needs to be added from the terminal.

# Technologies

Based on NodeJS with :
 - <a href="http://expressjs.com/" target="_blank">Express</a> : http/https handling
 - <a href="https://github.com/nodejitsu/node-http-proxy" target="_blank">http-proxy</a> : http/https routing
 - <a href="https://github.com/OptimalBits/redbird" target="_blank">Redbird</a> : websocket routing

# Development environment

Run from source : `node index.js`

Run from docker : `docker run -p 80:80 -p 3000:3000 Dockerfile`

**Ports** :

 - web : 8080 (configurable)
 - socket : 3000

# Production environment

Run from source : `node index.js`

Run from docker : `docker run -p 80:80 -p 3000:3000 -e NODE_ENV=prod Dockerfile`

**Ports** :
 - web : 80 (configurable)
 - socket : 3000

Needs a MariaDB database to run, to handle cookies for http queries. You can find the default .sql files to use in the docs.

For both environments, you should put your **Facebook App ID** for FB connect (see `index.html`)

# Database structure :

|  farm |
| ------------- |
| farm_id      |
| farm_name       |
| address |
| secret_key |

**farm_name** : Name of the farm for identification
**address** : web address to redirect to for the cloud

|  user |
| ------------- |
| id_user      |
| name       |
| password_hash |
| password_salt|
| farm_id |

**farm_id** : id of the farm to connect to.

### Licenses

Our work is licensed under the MIT license. See license.txt.

**This work uses sofware that is licensed under Apache 2.0 License, the GNU GPL v2.0 License. The respective files have kept their original license notices.**
