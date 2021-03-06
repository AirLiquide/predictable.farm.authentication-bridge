CREATE DATABASE predictablefarm;
CREATE DATABASE predictablefarm_cookies;

CREATE USER 'predictable_user'@'localhost' IDENTIFIED BY 'my_password';
GRANT ALL PRIVILEGES ON map.* TO 'predictable_user'@'localhost';
FLUSH PRIVILEGES;

USE predictablefarm;

# Farms
DROP TABLE `farm`;
CREATE TABLE `farm` (
    `farm_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `farm_name` TINYTEXT ,
    `address` TINYTEXT ,
    `secret_key` TINYTEXT
)ENGINE=MyISAM;

# Users
DROP TABLE `user`;
CREATE TABLE `user` (
    `id_user` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` TINYTEXT,
    `password_hash` TINYTEXT,
    `password_salt` TINYTEXT,
    `farm_id` INT
)ENGINE=MyISAM;

################
# TEST ENTRIES #
################

INSERT INTO `user`
SET `name`="farm1",
    `password_hash`=SHA1("test"),
    `password_salt`="-salt",
    `farm_id` = 1;

INSERT INTO `user`
SET `name`="farm2",
    `password_hash`=SHA1("test"),
    `password_salt`="-salt",
    `farm_id` = 2;

INSERT INTO `farm`
SET `farm_name`="farm1",
    `address`="http://localhost: ",
    `secret_key`="6CDD52F686B19267942D35196583E";

INSERT INTO `farm`
SET `farm_name`="farm2",
    `address`="http://localhost:8081",
    `secret_key`="B91474D59DD358BAA85E3192A63A3";

INSERT INTO `farm`
SET `farm_name`="farm3",
    `address`="http://localhost:8082",
    `secret_key`="D85BD9CDA3AB58518AA963DF75F1D";

INSERT INTO `farm`
SET `farm_name`="farm4",
    `address`="http://localhost:8083",
    `secret_key`="425C75E3D29F9C32CADFD5FD8A7D7";