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

-- Insert testing user data
INSERT INTO users (username, email, pass, avatar) VALUES ('Ropz', 'test@localhost', 'secret', 'https://gaimer.net/wp-content/uploads/2020/04/ropz-scaled.jpg'), ('Frozen', 'test@localhost', 'secret', 'https://liquipedia.net/commons/images/thumb/2/23/Frozen_EPICENTER_2019.jpg/450px-Frozen_EPICENTER_2019.jpg'), ('Dexter', 'test@localhost', 'secret', 'https://liquipedia.net/commons/images/thumb/6/67/Dexter_Asia_Minor_2019.jpeg/450px-Dexter_Asia_Minor_2019.jpeg'), ('chrisJ', 'test@localhost', 'secret', 'https://liquipedia.net/commons/images/thumb/0/0b/ChrisJ_at_DH_Masters_Marseille_18.jpg/451px-ChrisJ_at_DH_Masters_Marseille_18.jpg'), ('bymas', 'test@localhost', 'secret', 'https://cdn1.dotesports.com/wp-content/uploads/2020/09/02151749/bymas.jpg'), ('acoR', 'test@localhost', 'secret', 'https://liquipedia.net/commons/images/thumb/0/0b/AcoR_%40_IEM_Katowice_2020.jpg/450px-AcoR_%40_IEM_Katowice_2020.jpg'), ('Stewie2k', 'test@localhost', 'secret', 'https://cdn1.dotesports.com/wp-content/uploads/2020/05/20142352/47955079228_116657f760_o.jpg'), ('NadeKing', 'test@localhost', 'secret', 'https://yt3.ggpht.com/ytc/AKedOLSow0ZFWUxs42VHeF9okBlTyFflYAPyAOh4eWSXDA=s900-c-k-c0x00ffffff-no-rj');

-- Insert testing friend data
INSERT INTO friends (userid, friendid) VALUES (9, 2), (9, 3); -- where 9 is your user