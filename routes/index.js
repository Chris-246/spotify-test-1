var express = require("express");
var router = express.Router();
const cookieParser = require("cookie-parser");
const axios = require("axios");
const pool = require("../models/db");
require("dotenv").config();

const generateRandomString = (length) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};
const stateKey = "spotify_auth_state";
const scope =
  "user-read-private user-read-email playlist-read-private playlist-read-collaborative";

/* GET home page : pour lancer la connexion. */
router.get("/login", async (req, res, next) => {
  const state = generateRandomString(16);

  res.cookie(stateKey, state);

  const response = await axios.get(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${scope}&redirect_uri=${process.env.REDIRECT_URI}&state=${state}`
  );
  if (response) {
    res.redirect(
      `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${scope}&redirect_uri=${process.env.REDIRECT_URI}&state=${state}`
    );
  }
});

router.get("/callback", async (req, res) => {
  // récupération des éléments nécessaires à la connexion
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect("/#error=state_mismatch");
  } else {
    res.clearCookie(stateKey);

    //Requête classique à l'api Spotify pour l'authentification
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",

        `code=${code}&redirect_uri=${process.env.REDIRECT_URI}&grant_type=authorization_code`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " +
              Buffer.from(
                process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
              ).toString("base64"),
          },
        }
      );

      if (response.status === 200) {
        const access_token = response.data.access_token;
        const refresh_token = response.data.refresh_token;

        const spotiResponse = await axios.get(
          `https://api.spotify.com/v1/me/playlists`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + access_token,
            },
          }
        );

        if (spotiResponse) {
          const dataFetched = spotiResponse.data.items;

          //pour fournir la BDD PostgreSQL
          try {
            for (let i = 0; i < dataFetched.length; i++) {
              const newPlaylistsUser = await pool.query(
                `INSERT INTO playlistuser (name, description, owner, images, playlist_id) VALUES($1, $2, $3, $4, $5)`,
                [
                  dataFetched[i].name,
                  dataFetched[i].description,
                  dataFetched[i].owner.display_name,
                  [dataFetched[i].images[0].url],
                  dataFetched[i].id,
                ]
              );
            }
          } catch (error) {
            console.log(error);
          }

          res.redirect(
            `http://localhost:3000/#access_token=${access_token}&refresh_token=${refresh_token}`
          );
        } else {
          res.redirect("/#error=invalid_token");
        }
      }
    } catch (error) {
      console.log(error.response);
    }
  }
});

// router.get("/refresh_token", async (req, res) => {
//   // requesting access token from refresh token
//   const refresh_token = req.query.refresh_token;
//   try {
//     const refreshResponse = await axios.post(
//       "https://accounts.spotify.com/api/token",
//       {
//         grant_type: "refresh_token",
//         refresh_token: refresh_token,
//       },
//       {
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//           Authorization:
//             "Basic " +
//             Buffer.from(
//               process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
//             ).toString("base64"),
//         },
//       }
//     );
//     if (refreshResponse.statusCode === 200) {
//       const access_token = refreshResponse.body.access_token;
//       res.json({ access_token: access_token });
//     } else {
//       console.log("did not succeed");
//     }
//   } catch (error) {
//     console.log(error.response);
//   }
// });

module.exports = router;
