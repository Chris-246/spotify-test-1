import React from "react";
import axios from "axios";

const Home = () => {
  const handlePress = async () => {
    try {
      const response = await axios.get("http://localhost:5000/login");
      console.log(response.headers);

      window.location.assign(response.data.redirectAddress);
    } catch (error) {
      console.log(error.response);
    }
  };
  return (
    <div>
      Hello World!
      {/* <button
        onClick={() => {
          handlePress();
        }}
      >
        Allez!
      </button> */}
      <a href="http://localhost:5000/login">Allez !</a>
    </div>
  );
};

export default Home;
