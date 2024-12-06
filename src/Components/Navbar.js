import React from 'react';
import Logo from './Logo';
import "../Styles/Navbar.css"

const Navbar = () => {
  return (
    <div className="flex items-center justify-between p-8 pt-4">
      <Logo />
      <div className="flex items-center gap-4 pr-4">
        <div className="link hover:text-purple-400"><a href="#about">About</a></div>
        <div className="link hover:text-purple-400"><a href="#experience">Experience</a></div>
        <div className="link hover:text-purple-400"><a href="#projects">Projects</a></div>
        <div className="link hover:text-purple-400"><a href="#contact">Contact</a></div>
      </div>
    </div>
  );
};

export default Navbar;
