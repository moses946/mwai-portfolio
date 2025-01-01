import React from 'react';
import Logo from './Logo';
import "../Styles/Navbar.css"
import {useState} from 'react';
const Navbar = () => {
 
  const [burgerOpen, setBurgerOpen] = useState(false);

  const menuAnimation = () => {
    setBurgerOpen(!burgerOpen)
  }

  return (
    <>
    <div className="flex items-center justify-between p-8 pt-4">
      <Logo />
      <div className="flex items-center gap-4 pr-4 bignav">
        <div className="link hover:text-purple-400"><a href="#about">About</a></div>
        <div className="link hover:text-purple-400"><a href="#experience">Experience</a></div>
        <div className="link hover:text-purple-400"><a href="#projects">Projects</a></div>
        <div className="link hover:text-purple-400"><a href="#contact">Contact</a></div>
      </div>

      <div className="smallnav flex flex-col justify-center">
        <i className={`bi bi-list list-burger ${burgerOpen ? "hidden-btn": ""}`} onClick={menuAnimation} ></i>
        <i className={`bi bi-x close-burger ${burgerOpen ? "" : "hidden-btn"}`} onClick={menuAnimation}></i>
      </div> 

    </div>

    <div className={`side-menu flex justify-center gap-4 flex-col ${burgerOpen ? "open" : "close"}`} >
          <div className="link hover:text-purple-400"><a href="#about">About</a></div>
          <div className="link hover:text-purple-400"><a href="#experience">Experience</a></div>
          <div className="link hover:text-purple-400"><a href="#projects">Projects</a></div>
          <div className="link hover:text-purple-400"><a href="#contact">Contact</a></div>
    </div>
    </>

  );
};

export default Navbar;
