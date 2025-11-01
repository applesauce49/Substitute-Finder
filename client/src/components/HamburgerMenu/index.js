import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./HamburgerMenu.css";

const HamburgerMenu = ({ routes = [] }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  // ✅ Close the menu if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="hamburger-wrapper" ref={wrapperRef}>
      <button
        className={`hamburger ${open ? "is-active" : ""}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {open && (
        <div className={`hamburger-menu ${open ? "open" : ""}`}>
          {routes.map((route, i) => (
            <button
              key={route.key ?? route.path ?? `${route.label}-${i}`}
              type="button"
              className="hamburger-link nav-bar-links"
              onClick={() => {
                closeMenu();
                if (typeof route.onClick === "function") {
                  route.onClick();
                } else if (route.path) {
                  navigate(route.path);
                }
              }}
            >
              {route.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

HamburgerMenu.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
};

export default HamburgerMenu;