import React from "react";
import { FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="w-100 mt-auto bg-dark p-3 text-white">
      <div className="footer-text">
        &copy;{new Date().getFullYear()} |&nbsp;
        <a
          rel="noopener noreferrer"
          target="_blank"
          className="gitlink"
          href="https://reactjs.org/"
        >
          Built with React
        </a>
        &nbsp;| &nbsp;
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/applesauce49/Substitute-Finder"
        >
          <FaGithub className="github-icon" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
