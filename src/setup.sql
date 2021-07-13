CREATE DATABASE IF NOT EXISTS csc;
USE csc;

CREATE TABLE IF NOT EXISTS users (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  username text(20) NOT NULL,
  email text(255) NOT NULL,
  pass text(64) NOT NULL,
  avatar text(255),
  registered timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  curRank int(1) NOT NULL DEFAULT 0,
  isAdmin tinyint(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS games (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  startTime timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  FOREIGN KEY (userid) REFERENCES users(id),
  FOREIGN KEY (gameid) REFERENCES games(id)				
);
