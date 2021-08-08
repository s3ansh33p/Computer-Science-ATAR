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
  isAdmin tinyint(1) NOT NULL DEFAULT 0,
  isOnline tinyint(1) NOT NULL DEFAULT 1
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

CREATE TABLE IF NOT EXISTS friends (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  userid int(8) NOT NULL,
  friendid int(8) NOT NULL,
  sentTime timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted tinyint(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (userid) REFERENCES users(id),
  FOREIGN KEY (friendid) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS updates (
  id int(8) PRIMARY KEY AUTO_INCREMENT NOT NULL,
  title text(64) NOT NULL,
  link text(64) NOT NULL,
  content text(255) NOT NULL,
  added timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert testing user data
INSERT INTO users (username, email, pass, avatar) VALUES ('Ropz', 'test@localhost', 'secret', 'https://gaimer.net/wp-content/uploads/2020/04/ropz-scaled.jpg'), ('Frozen', 'test@localhost', 'secret', 'https://www.heavybullets.com/wp-content/uploads/2020/02/Frozen.jpg'), ('Dexter', 'test@localhost', 'secret', 'https://ggscore.com/media/logo/p10240.png'), ('chrisJ', 'test@localhost', 'secret', 'https://www.bestgamingsettings.com/wp-content/uploads/2020/02/Chris-chrisj-de-Jong.jpg'), ('bymas', 'test@localhost', 'secret', 'https://cdn1.dotesports.com/wp-content/uploads/2020/09/02151749/bymas.jpg'), ('acoR', 'test@localhost', 'secret', 'https://prosettings.net/wp-content/uploads/2021/05/bymas-profile-picture-3.jpg'), ('Stewie2k', 'test@localhost', 'secret', 'https://cdn1.dotesports.com/wp-content/uploads/2020/05/20142352/47955079228_116657f760_o.jpg'), ('NadeKing', 'test@localhost', 'secret', 'https://yt3.ggpht.com/ytc/AKedOLSow0ZFWUxs42VHeF9okBlTyFflYAPyAOh4eWSXDA=s900-c-k-c0x00ffffff-no-rj');

-- Insert testing game data
INSERT INTO games (mode, map) VALUES (1, 1), (1, 1), (1, 1), (1, 1);

-- Insert testing updates data
INSERT INTO updates (title, link, content) VALUES ('Release Notes for 2/8/2021', 'https://github.com/s3ansh33p/Computer-Science-ATAR/commit/83470e8cf54bd1b6ccc4c9210d2908e47ef2945b', '**Markdown Content** \n - 1\n - 2\n Something like this'), ('Release Notes for 4/8/2021', 'https://github.com/s3ansh33p/Computer-Science-ATAR/commit/83470e8cf54bd1b6ccc4c9210d2908e47ef2945b', '**Markdown Content** \n - 1\n - 2\n Something like this'), ('Release Notes for 6/8/2021', 'https://github.com/s3ansh33p/Computer-Science-ATAR/commit/83470e8cf54bd1b6ccc4c9210d2908e47ef2945b', '**Markdown Content** \n - 1\n - 2\n Something like this')

-- Insert testing results data
INSERT INTO results (userid, gameid, kills, assists, deaths) VALUES (9, 1, 1, 1, 1), (9, 2, 5, 2, 3), (9, 3, 4, 5, 6), (9, 4, 17, 12, 7);

-- Insert testing friend data after creating your user
INSERT INTO friends (userid, friendid) VALUES (9, 1), (9, 2), (9, 5), (9, 7), (9, 8); -- where 9 is your user