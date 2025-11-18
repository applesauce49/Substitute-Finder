import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "./logo.svg";
import "./App.css";

const Branding = () => (
    <Link className="main-logo" to="/">
        <motion.div
            initial={{ x: -100, opacity: 0 }}   // off-screen to the left, invisible
            animate={{
                x: 0,
                opacity: 1,
                transition: {
                    type: "spring",   // natural bounce
                    stiffness: 120,
                    damping: 12,
                    duration: 0.8,
                },
            }}
            exit={{
                opacity: 0,
                transition: { duration: 0.4 },
            }}
        >
            <h1 className="mb-1 mt-0 main-logo">
                Sub At
                <span>
                    {" "}
                    <img src={logo} className="App-logo" alt="logo" />
                </span>
                mic
            </h1>
            <p className="sub-title">An app for finding Substitute Peer Parents</p>
        </motion.div>
    </Link>
);

export default Branding;