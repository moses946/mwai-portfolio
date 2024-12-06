import React from "react";
import PageTitle from "../Components/PageTitle";
import EmailCard from "../Components/EmailCard";
import "../Styles/Contact.css";

const Footer = () => {
  return (
    <section className="Footer" id="contact">
      <PageTitle PageName="Get in touch" />
      <p className="section-desc">
        What's next? Feel free to reach out to me if you are looking for a
        developer, have a query, or simply want to connect.
      </p>
      <EmailCard email="mosesmwaiw@gmail.com" />
      <p className="social-sect">You may also find me on:</p>
      <div className="social-links flex gap-4 py-2">
        <a href="https://github.com/moses946" target="_blank" rel="noreferrer">
          <i class="bi bi-github"></i>
        </a>
        <a
          href="https://linkedin.com/in/moses-mwai"
          target="_blank"
          rel="noreferrer"
        >
          <i class="bi bi-linkedin"></i>
        </a>
        <a href="https://x.com/mwaii__" target="_blank" rel="noreferrer">
          <i class="bi bi-twitter"></i>
        </a>
      </div>
    </section>
  );
};

export default Footer;
