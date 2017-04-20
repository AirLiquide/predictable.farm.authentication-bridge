## Predictable.Farm-Bridge ##

Node application used to proxy requests to the correct cloud environment.
Handle http queries and websocket queries.

To be forwarded, a farm/user **MUST** be added to the database.

Run from source : `node index.js`
Run from docker : `docker run -p 80:80 -p 3000:3000 -e NODE_ENV=prod registry.gitlab.com/briceculas/predictable-farm-bridge`

**Ports** :
 - web : 80 (prod) / 8080 (dev)
 - socket : 3000

Needs a mariaDB database to run, to handle cookies for http queries. You can find the default .sql files to use in the
docs.

**Database structure** :
|  farm
| ------------- |
| farm_id      |
| farm_name       |
| address |
| secret_key |
&
|  user |
| ------------- |
| id_user      |
| name       |
| password_hash |
| password_salt|
| farm_id |
