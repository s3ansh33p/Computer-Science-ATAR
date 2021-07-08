CREATE DATABASE IF NOT EXISTS csc;
USE csc;

CREATE TABLE IF NOT EXISTS users (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  username text(20) NOT NULL,
  email text(255) NOT NULL,
  password text(64) NOT NULL,
  avatar text(255),
  registered timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rank int(1) NOT NULL DEFAULT 0,
  admin tinyint(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS games (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  started timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration int(3) NOT NULL DEFAULT 600,
  mode int(1) NOT NULL DEFAULT 0,
  map int(1) NOT NULL DEFAULT 0,
  winner tinyint(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS results (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  userid int(8) NOT NULL,
  gameid int(8) NOT NULL,
  kills int(3) NOT NULL DEFAULT 0,
  assists int(3) NOT NULL DEFAULT 0,
  deaths int(3) NOT NULL DEFAULT 0,
  FOREIGN KEY (userid) REFERENCES Users(id),
  FOREIGN KEY (gameid) REFERENCES Games(id)				
);
