import React, { useState, useEffect } from "react";
import axios from "axios";

const Home = () => {
  const currentLocation = window.location.hash;
  let accessToken;

  //State pour récupérer les playlists
  const [playlistData, setPlaylistData] = useState();

  //State pour chargement requête
  const [isLoading, setIsLoading] = useState(true);

  //State pour récupérer le TOP 5 des artistes de la playlist au clic
  const [topArtists, setTopArtists] = useState();

  //State pour apparition de la modal
  const [showModal, setShowModal] = useState(false);

  //permet de récupérer l'access token nécessaire pour la requête "artistes"
  if (currentLocation) {
    const currentLocationArray = currentLocation.split("=");

    accessToken = currentLocationArray[1].split("&")[0];
  }

  //Requête pour récupérer les playlists de la BDD
  const fetchPlaylists = async (currentLocation) => {
    if (currentLocation) {
      try {
        const response = await axios.get(
          "http://localhost:5000/users/playlists"
        );
        if (response) {
          setPlaylistData(response.data);
          setIsLoading(false);
        } else {
          console.log("Request Error");
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  //   Gestion du clic utilisateur pour faire apparaitre les 5 artistes demandés
  const handlePress = async (playlistId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/users/playlists/artists/${playlistId}?access_token=${accessToken}`
      );
      console.log(response.data);
      setTopArtists(response.data);
      setShowModal(true);
    } catch (error) {
      console.log(error.response);
    }
  };

  useEffect(() => {
    fetchPlaylists(currentLocation);
  }, [currentLocation]);

  return (
    <div className={isLoading ? "firstMain" : "main"}>
      <div className="container">
        <header className="header">
          <h1 className="title">Vos playlists</h1>
          <a href="http://localhost:5000/login" className="connexionLink">
            Connexion
          </a>
        </header>
        {/* Condition nécessaire pour laisser le temps de charger le contenu de la requête */}
        {!isLoading ? (
          <div>
            <ul className="playlistContainer">
              {playlistData.map((item, index) => {
                return (
                  <li key={index} className="playlistBox">
                    <img
                      src={item.images[0]}
                      alt="playlistImage"
                      className="playlistImage"
                      onClick={() => {
                        handlePress(item.playlist_id);
                      }}
                    />
                    <div className="textBox">
                      <div className="textName">
                        {" "}
                        <span className="boldText">Nom</span> : {item.name}
                      </div>
                      <div className="textDescription">
                        <span className="boldText">Description</span> :{" "}
                        {item.description}
                      </div>
                      <div className="textOwner">
                        <span className="boldText">Owner</span> : {item.owner}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <></>
        )}
      </div>

      {/* Modale pour les artistes */}
      {!showModal ? (
        <></>
      ) : (
        <div className="artistModal">
          <div
            className="exitModal"
            onClick={() => {
              setShowModal(false);
            }}
          >
            X
          </div>
          <h2 className="artistTitle">Top artists</h2>
          <ul className="artistBox">
            {topArtists.map((artist, i) => {
              return (
                <li key={i} className="artist">
                  {artist[0]}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className={!showModal ? null : "modalBackground"}></div>
    </div>
  );
};

export default Home;
