import React, { useState, useEffect } from "react";
import Logo from "./Logo";
import "../Styles/Navbar.css";

const Navbar = () => {
  const [burgerOpen, setBurgerOpen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
  
    if (burgerOpen) {
      document.body.style.overflow = "hidden";
      html.style.overflow = "hidden"; // Prevent vertical scrolling
    } else {
      document.body.style.overflow = "";
      html.style.overflow = ""; // Re-enable vertical scrolling
    }
  
    return () => {
      document.body.style.overflow = "";
      html.style.overflow = ""; // Clean up on component unmount
    };
  }, [burgerOpen]);
  

  const menuAnimation = () => {
    setBurgerOpen((prev) => !prev);
  };

  return (
    <>
      <div className="flex items-center justify-between p-8 pt-4 max-w-full">
        <Logo />
        <div className="flex items-center gap-4 pr-4 bignav">
          <div className="link hover:text-purple-400">
            <a href="#about">About</a>
          </div>
          <div className="link hover:text-purple-400">
            <a href="#experience">Experience</a>
          </div>
          <div className="link hover:text-purple-400">
            <a href="#projects">Projects</a>
          </div>
          <div className="link hover:text-purple-400">
            <a href="#contact">Contact</a>
          </div>
        </div>

        <div className="smallnav flex flex-col justify-center">
          {burgerOpen ? (
            <i className="bi bi-x close-burger" onClick={menuAnimation}></i>
          ) : (
            <i className="bi bi-list list-burger" onClick={menuAnimation}></i>
          )}
        </div>
      </div>

      <div
        className={`side-menu flex justify-center gap-4 flex-col ${
          burgerOpen ? "open" : "close"
        }`}
      >
        <div className="link hover:text-purple-400" onClick={menuAnimation}>
          <a href="#about">About</a>
        </div>
        <div className="link hover:text-purple-400" onClick={menuAnimation}>
          <a href="#experience">Experience</a>
        </div>
        <div className="link hover:text-purple-400" onClick={menuAnimation}>
          <a href="#projects">Projects</a>
        </div>
        <div className="link hover:text-purple-400" onClick={menuAnimation}>
          <a href="#contact">Contact</a>
        </div>
      </div>
    </>
  );
};

export default Navbar;
