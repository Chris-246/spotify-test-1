var express = require("express");
var router = express.Router();
const cookieParser = require("cookie-parser");
const axios = require("axios");
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
const scope = "user-read-private user-read-email";

/* GET home page. */
router.get("/login", async (req, res, next) => {
  const state = generateRandomString(16);

  res.cookie(stateKey, state);

  const response = await axios.get(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${scope}&redirect_uri=${process.env.REDIRECT_URI}&state=${state}`
  );
  if (response) {
    // console.log(response.data);
    // res.json({
    //   redirectAddress: `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${scope}&redirect_uri=${process.env.REDIRECT_URI}&state=${state}`,
    // });
    res.redirect(
      `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${scope}&redirect_uri=${process.env.REDIRECT_URI}&state=${state}`
    );
  }
});

router.get("/callback", async (req, res) => {
  // your application requests refresh and access tokens
  // after checking the state parameter

  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;
  console.log("QUERY ===========>", req.query);
  console.log("COOKIES ===========>", req.cookies);

  if (state === null || state !== storedState) {
    res.redirect("/#error=state_mismatch");
  } else {
    res.clearCookie(stateKey);

    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        {
          code: code,
          redirect_uri: process.env.REDIRECT_URI,
          grant_type: "authorization_code",
        },
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
      console.log(response);
      if (response.statuscode === 200) {
        const access_token = response.body.access_token;
        const refresh_token = response.body.refresh_token;

        const spotiResponse = await axios.get("https://api.spotify.com/v1/me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + access_token,
          },
        });

        if (spotiResponse) {
          console.log(spotiResponse);
          res.redirect(
            `/#access_token=${access_token}&refresh_token=${refresh_token}`
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

router.get("/refresh_token", async (req, res) => {
  // requesting access token from refresh token
  const refresh_token = req.query.refresh_token;
  try {
    const refreshResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      },
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
    if (refreshResponse.statusCode === 200) {
      const access_token = refreshResponse.body.access_token;
      res.json({ access_token: access_token });
    } else {
      console.log("did not succeed");
    }
  } catch (error) {
    console.log(error.response);
  }
});

module.exports = router;

// var authOptions = {
//   url: "https://accounts.spotify.com/api/token",
//   form: {
//     code: code,
//     redirect_uri: redirect_uri,
//     grant_type: "authorization_code",
//   },
//   headers: {
//     Authorization:
//       "Basic " +
//       Buffer.from(
//         process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET
//       ).toString("base64"),
//   },
//   json: true,
// };

// request.post(authOptions, function (error, response, body) {
//   if (!error && response.statusCode === 200) {
//     var access_token = body.access_token,
//       refresh_token = body.refresh_token;

//     var options = {
//       url: "https://api.spotify.com/v1/me",
//       headers: { Authorization: "Bearer " + access_token },
//       json: true,
//     };

//     // use the access token to access the Spotify Web API
//     request.get(options, function (error, response, body) {
//       console.log(body);
//     });

//     // we can also pass the token to the browser to make requests from there
//     res.redirect(
//       "/#" +
//         querystring.stringify({
//           access_token: access_token,
//           refresh_token: refresh_token,
//         })
//     );
//   } else {
//     res.redirect(
//       "/#" +
//         querystring.stringify({
//           error: "invalid_token",
//         })
//     );
//   }
// });

// authOptions, function (error, response, body) {
//   if (!error && response.statusCode === 200) {
//     var access_token = body.access_token;
//     res.send({
//       access_token: access_token,
//     });
//   }
// });
