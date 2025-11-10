import React, { useState } from 'react';
import Tetris from 'react-tetris';
// import "react-tetris/dist/styles.css";  // ensure visuals load
import "./tetris.css"; // your overrides

export default function MaintenanceTetris() {
    const [showHelp, setShowHelp] = useState(false);
    const [controllerRef, setControllerRef] = useState(null);

    const sendPauseKey = () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    };


    React.useEffect(() => {
        if (!controllerRef) return;
        if (showHelp) sendPauseKey();
        else sendPauseKey();
    }, [showHelp, controllerRef]);

    return (
        <div style={{ textAlign: "center", marginTop: 80 }}>
            <h2>🚧 Maintenance in Progress</h2>
            <p>While you wait, play some Tetris!</p>

            <div style={{ display: "inline-block", marginTop: "20px" }}>
                <Tetris
                    keyboardControls={{
                        down: 'MOVE_DOWN',
                        left: 'MOVE_LEFT',
                        right: 'MOVE_RIGHT',
                        space: 'HARD_DROP',
                        z: 'FLIP_COUNTERCLOCKWISE',
                        x: 'FLIP_CLOCKWISE',
                        up: 'FLIP_CLOCKWISE',
                        p: 'TOGGLE_PAUSE',
                        c: 'HOLD',
                        shift: 'HOLD',
                    }}
                >
                    {({
                        HeldPiece,
                        Gameboard,
                        PieceQueue,
                        points,
                        linesCleared,
                        state,
                        controller,
                    }) => {
                        if (!controllerRef) setControllerRef(controller);

                        return (
                            <>
                                <div className="tetris-stats d-flex justify-content-between align-items-center gap-2">
                                    <p>Points: {points}</p>
                                    <p>Lines Cleared: {linesCleared}</p>
                                    <button
                                        className="btn btn-info mb-3"
                                        onClick={() => setShowHelp((prev) => !prev)}
                                    >
                                        ?
                                    </button>

                                    {showHelp && (
                                        <div className="tetris-overlay">
                                            <h4>🎮 Controls</h4>
                                            <ul>
                                                <li><b>← / →</b> – Move left / right</li>
                                                <li><b>↓</b> – Soft drop</li>
                                                <li><b>Space</b> – Hard drop</li>
                                                <li><b>X / Up</b> – Rotate clockwise</li>
                                                <li><b>Z</b> - Rotate couterclockwise</li>
                                                <li><b>C / Shift</b> – Hold piece</li>
                                                <li><b>P</b> – Pause</li>
                                            </ul>
                                        </div>
                                    )}

                                </div>
                                <div className="tetris-wrapper">
                                    <div className="tetris-layout">
                                        <HeldPiece />
                                        <Gameboard />
                                        <PieceQueue />
                                    </div>
                                </div>
                                {state === 'LOST' && (
                                    <div className="tetris-overlay d-flex flex-column align-items-center gap-2">
                                        <h2>Game Over</h2>
                                        <button onClick={controller.restart}>New Game</button>
                                    </div>
                                )}
                            </>
                        );
                    }}
                </Tetris>
            </div>
        </div>
    );
}