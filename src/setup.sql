-- Sean McGinty - Computer Science Project v0.0.1 (https://dev.seanmcginty.space)
-- Copyright 2021 Sean McGinty
-- Licensed under MIT (https://github.com/s3ansh33p/computer-science-atar/blob/master/LICENSE)


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

CREATE TABLE IF NOT EXISTS badges (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  badgeName text(64) NOT NULL,
  badgeAdded timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playerBadges (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  userid int(8) NOT NULL,
  badgeid int(8) NOT NULL,
  badgeAchieved timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userid) REFERENCES users(id),
  FOREIGN KEY (badgeid) REFERENCES badges(id)				
);