import React from "react";
import "../Styles/Home.css"
// import PhotoCard from "../Components/PhotoCard";
import yourPhoto from "../assets/mwai home.jpg";
import Typed from 'typed.js';
import {useRef, useEffect} from "react";

const Home = () => {
  const el = useRef(null);
  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: ["Hi, I'm Moses Mwai 👋", "Salut, je suis Moses Mwai 👋","你好，我是Moses Mwai 👋","Hallo, ich bin Moses Mwai 👋", "Hi, I'm Moses Mwai 👋"],
      typeSpeed: 50,
    });

    return () => {
      // Destroy Typed instance during cleanup to stop animation
      typed.destroy();
    };
  }, []);

  return (
    <div className="HomePage p-4 flex gap-4 justify-center  flex-row-reverse">
      <div className="homeImage">
      {/* <PhotoCard photoSrc={yourPhoto} altText="Your photo description" /> */}
      <img src={yourPhoto} alt="" srcset="" />
      </div>
      <div className="homeText flex flex-col px-8 ">
        <div className="title">
          <h1><span ref={el} /></h1>
        </div>
        <div className="home-desc py-4">
          <p>
            I’m a software engineer passionate about bringing ideas
            to life through intuitive and powerful digital experiences. From
            crafting sleek web and mobile apps to leveraging AI for smarter
            solutions, I’m here to build tools that help businesses grow and
            users feel right at home.
          </p>
        </div>
        <div className="location flex py-4 gap-3">
          <i class="bi bi-geo-alt"></i> <p>Nairobi, Kenya</p>
        </div>
        <div className="social-links flex gap-4 py-3">
          <a href="https://github.com/moses946" target="_blank" rel="noreferrer"><i class="bi bi-github"></i></a>
          <a href="https://linkedin.com/in/moses-mwai" target="_blank" rel="noreferrer"><i class="bi bi-linkedin"></i></a>
          <a href="https://x.com/mwaii__" target="_blank" rel="noreferrer"><i class="bi bi-twitter"></i></a>
        </div>
      </div>
    </div>
  );
};

export default Home;
