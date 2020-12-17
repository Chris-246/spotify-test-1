var express = require("express");
var router = express.Router();
const pool = require("../models/db");
const axios = require("axios");

// Fonction pour récupérer les 5 artistes les plus représentés de la playlist
const topArtists = (tab) => {
  let countObject = {};
  for (let i = 0; i < tab.length; i++) {
    if (!countObject[tab[i]]) {
      countObject[tab[i]] = 1;
    } else {
      countObject[tab[i]] += 1;
    }
  }

  const countObjectTab = Object.entries(countObject);
  const countObjectOrder = countObjectTab.sort((a, b) => {
    return b[1] - a[1];
  });
  return countObjectOrder.slice(0, 5);
};

/* GET users listing. */
router.get("/playlists", async (req, res, next) => {
  try {
    const allPlaylists = await pool.query("SELECT * FROM playlistuser");
    res.status(200).json(allPlaylists.rows);
  } catch (error) {
    console.log(error);
  }
});

// GET users Playlists Artists

router.get("/playlists/artists/:id", async (req, res) => {
  //  Récupération de l'id de la playlist et de l'access_token
  const playlistId = req.params;
  const access_token = req.query;
  console.log(access_token, playlistId);

  // Requête à l'api spotify pour les détails de la playlist
  try {
    const spotiResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId.id}/tracks`,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + access_token.access_token,
        },
      }
    );
    const itemsPlaylist = spotiResponse.data.items;
    console.log(spotiResponse.data.items[0].track.artists);

    const artistsTab = [];

    for (let i = 0; i < itemsPlaylist.length; i++) {
      for (let j = 0; j < itemsPlaylist[i].track.artists.length; j++) {
        artistsTab.push(itemsPlaylist[i].track.artists[j].name);
      }
    }
    // res.status(200).json({ artistsTab });
    const top = topArtists(artistsTab);
    res.status(200).json(top);
  } catch (error) {
    console.log(error.response.data);
  }
});

module.exports = router;
