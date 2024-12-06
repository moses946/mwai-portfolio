import React from "react";
import PageTitle from "../Components/PageTitle";
import "../Styles/About.css"
import mwaiAbout from "../assets/mwai about.jpg";

const About = () => {
  return (
    <div className="about" id="about">
    <PageTitle PageName="About Me" />
      <div className="aboutContent">
          <div className="aboutImage">
            <img src={mwaiAbout} alt="" srcset="" />
          </div>
          <div className="aboutText">
            <h1>Curious About me?</h1>
            <p>
              My journey into software engineering was sparked by a Disney show that
              many wouldn’t expect—Lab Rats. Watching the characters, especially
              Donald, tackle challenges and create innovative solutions fascinated
              me. While I was initially drawn to hardware, the creative potential of
              software quickly won me over. The idea of building something from
              scratch, turning abstract problems into tangible solutions, became my
              true passion.
            </p>
            <p>
              I specialize in JavaScript, Python, Flutter, Node.js, and React—tools
              that let me transform ideas into dynamic, user-friendly applications.
              Whether I'm developing responsive web apps or sleek mobile
              experiences, I approach each project with a blend of creativity and
              precision. My goal? To craft experiences that not only function but
              captivate and inspire.
            </p>
            <p>
              I approach development with an engineer’s mindset: start with a
              problem, then find the most efficient way to solve it. This focus on
              optimization and scalability ensures that the solutions I build not
              only meet the immediate need but also stand the test of time. Outside
              of coding, I enjoy reading, binging Netflix shows, and catching a
              football match—things that fuel my creativity and help me stay
              inspired for the next big challenge😁.
            </p>
          </div>
              </div>
      </div>
  );
};

export default About;