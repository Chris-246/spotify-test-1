CREATE DATABASE spotifyTest;

CREATE TABLE playlistUser(
    playlistUser_id SERIAL PRIMARY KEY,
    name VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    owner VARCHAR(250) NOT NULL,
    images TEXT[],
    playlist_id TEXT UNIQUE NOT NULL
)