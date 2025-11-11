import React, { useState, useRef, useEffect } from 'react';
import { render } from 'react-dom';
import Pacman from 'react-pacman';

export default function MyPacman() {
    // const [showHelp, setShowHelp] = useState(false);
    // const controllerRef = useRef(null);

    // const sendPauseKey = () => {
    //     window.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    // };

    // useEffect(() => {
    //     if (!controllerRef) return;
    //     if (showHelp) sendPauseKey();
    //     else sendPauseKey();
    // }, [showHelp, controllerRef]);

    return (
        <div style={{ textAlign: "center", marginTop: 80 }}>
            <div style={{ display: "inline-block", marginTop: "20px" }}>
                <Pacman
                    width={400}
                    height={400}
                    mazeColor="#000000"
                    dotColor="#FFCC00"
                    powerPelletColor="#FF0000"
                    ghostColors={['#FF0000', '#00FF00', '#0000FF', '#FFFF00']}
                />
            </div>
        </div>
    );
}
