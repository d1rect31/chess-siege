import React, { useState, useEffect, useRef } from 'react';

// --- CONSTANTS & CONFIG ---
const TILE_SIZE = 64;
const SPRITE_TILE_SIZE = 45;
const ANIMATION_SPEED = 200; // ms

const PIECE_VALUES = {
    pawn: 10,
    knight: 30,
    bishop: 30,
    rook: 40,
    queen: 60,
    king: 0
};

const KILL_REWARDS = {
    pawn: 5,
    knight: 15,
    bishop: 15,
    rook: 20,
    queen: 30
};

const SPRITE_OFFSETS = {
    king: 0,
    queen: 45,
    bishop: 90,
    knight: 135,
    rook: 180,
    pawn: 225
};

// WAVES CONFIGURATION
// Structure: { duration: number_of_turns, units: [ {type, col}, ... ] }
const WAVES = [
    { duration: 2, units: [{ type: 'pawn', col: 2 }, { type: 'pawn', col: 5 }] }, // 1. C8, F8
    { duration: 2, units: [{ type: 'pawn', col: 1 }, { type: 'pawn', col: 3 }, { type: 'pawn', col: 6 }] }, // 2. B8, D8, G8
    { duration: 3, units: [{ type: 'pawn', col: 2 }, { type: 'pawn', col: 5 }, { type: 'knight', col: 4 }] }, // 3. C8, F8, E8
    { duration: 3, units: [{ type: 'pawn', col: 0 }, { type: 'pawn', col: 7 }, { type: 'knight', col: 3 }, { type: 'knight', col: 5 }] }, // 4
    { duration: 4, units: [{ type: 'pawn', col: 2 }, { type: 'pawn', col: 4 }, { type: 'pawn', col: 6 }, { type: 'bishop', col: 3 }] }, // 5
    { duration: 4, units: [{ type: 'knight', col: 1 }, { type: 'knight', col: 6 }, { type: 'pawn', col: 3 }, { type: 'pawn', col: 5 }] }, // 6
    { duration: 2, units: [{ type: 'pawn', col: 1 }, { type: 'pawn', col: 2 }, { type: 'pawn', col: 3 }, { type: 'pawn', col: 4 }, { type: 'pawn', col: 5 }, { type: 'pawn', col: 6 }] }, // 7
    { duration: 3, units: [{ type: 'bishop', col: 2 }, { type: 'bishop', col: 5 }, { type: 'pawn', col: 3 }, { type: 'pawn', col: 4 }] }, // 8
    { duration: 4, units: [{ type: 'rook', col: 0 }, { type: 'rook', col: 7 }, { type: 'pawn', col: 3 }, { type: 'pawn', col: 4 }] }, // 9
    { duration: 3, units: [{ type: 'bishop', col: 2 }, { type: 'bishop', col: 5 }, { type: 'knight', col: 3 }, { type: 'knight', col: 4 }] }, // 10
    { duration: 2, units: [{ type: 'knight', col: 2 }, { type: 'knight', col: 5 }, { type: 'rook', col: 4 }] }, // 11
    { duration: 4, units: [{ type: 'rook', col: 1 }, { type: 'rook', col: 6 }, { type: 'bishop', col: 3 }, { type: 'bishop', col: 4 }] }, // 12
    { duration: 3, units: [{ type: 'queen', col: 3 }, { type: 'pawn', col: 1 }, { type: 'pawn', col: 6 }] }, // 13
    { duration: 5, units: [{ type: 'rook', col: 0 }, { type: 'rook', col: 7 }, { type: 'bishop', col: 2 }, { type: 'bishop', col: 5 }, { type: 'pawn', col: 4 }] }, // 14
    { duration: 4, units: [{ type: 'queen', col: 4 }, { type: 'knight', col: 2 }, { type: 'knight', col: 5 }, { type: 'pawn', col: 3 }] }, // 15
    { duration: 4, units: [{ type: 'queen', col: 3 }, { type: 'rook', col: 2 }, { type: 'rook', col: 5 }, { type: 'pawn', col: 4 }] }, // 16
    { duration: 3, units: [{ type: 'pawn', col: 0 }, { type: 'pawn', col: 1 }, { type: 'pawn', col: 2 }, { type: 'pawn', col: 3 }, { type: 'pawn', col: 4 }, { type: 'pawn', col: 5 }, { type: 'pawn', col: 6 }, { type: 'pawn', col: 7 }, { type: 'bishop', col: 3 }] }, // 17
    { duration: 5, units: [{ type: 'rook', col: 1 }, { type: 'rook', col: 6 }, { type: 'knight', col: 3 }, { type: 'knight', col: 4 }, { type: 'queen', col: 5 }] }, // 18
    { duration: 5, units: [{ type: 'queen', col: 3 }, { type: 'queen', col: 4 }, { type: 'rook', col: 2 }, { type: 'rook', col: 5 }, { type: 'pawn', col: 7 }] }, // 19
    { duration: 999, units: [{ type: 'rook', col: 0 }, { type: 'rook', col: 7 }, { type: 'bishop', col: 2 }, { type: 'bishop', col: 5 }, { type: 'queen', col: 3 }, { type: 'queen', col: 4 }, { type: 'knight', col: 1 }, { type: 'knight', col: 6 }] } // 20 Final - Must Kill All
];

// --- SVG DATA ---
const CHESS_SPRITE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="270" height="90">
    <g style="fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,0)">
        <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
        <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style="fill:#ffffff; stroke:#000000; stroke-linecap:butt; stroke-linejoin:miter;" />
        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z " style="fill:#ffffff; stroke:#000000;" />
        <path d="M 11.5,30 C 17,27 27,27 32.5,30" style="fill:none; stroke:#000000;" />
        <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" style="fill:none; stroke:#000000;" />
        <path d="M 11.5,37 C 17,34 27,34 32.5,37" style="fill:none; stroke:#000000;" />
    </g>    
    <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(45,0)">
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(-1,-1)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(15.5,-5.5)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(32,-1)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(7,-4.5)" />
        <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(24,-4)" />
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z " style="stroke-linecap:butt;" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z " style="stroke-linecap:butt;" />
        <path d="M 11.5,30 C 15,29 30,29 33.5,30" style="fill:none;" />
        <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style="fill:none;" />
    </g>
    <g style="opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(90,0)">
        <g style="fill:#ffffff; stroke:#000000; stroke-linecap:butt;"> 
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
        </g>
        <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
    </g>
    <g style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(135,0)">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#ffffff; stroke:#000000;" />
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#ffffff; stroke:#000000;" />
        <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#000000; stroke:#000000;" />
        <path d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#000000; stroke:#000000;" />
    </g>
    <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(180,0)">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" style="stroke-linecap:butt;" />
        <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
        <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" style="stroke-linecap:butt; stroke-linejoin:miter;" />
        <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
        <path d="M 11,14 L 34,14" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
    </g>   
    <g transform="translate(225,0)">
        <path d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z " style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" />
    </g>
    <g style="fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,45)">
        <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
        <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style="fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;" />
        <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z " style="fill:#000000; stroke:#000000;" />
        <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
        <path d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.51,26.6 L 22.5,24.5 C 20,18 9.906,14 6.997,19.85 C 4.5,25.5 11.85,28.85 11.85,28.85" style="fill:none; stroke:#ffffff;" />
        <path d="M 11.5,30 C 17,27 27,27 32.5,30 M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5 M 11.5,37 C 17,34 27,34 32.5,37" style="fill:none; stroke:#ffffff;" />
    </g>
    <g style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(45,45)">
        <g style="fill:#000000; stroke:none;">
            <circle cx="6"    cy="12" r="2.75" />
            <circle cx="14"   cy="9"  r="2.75" />
            <circle cx="22.5" cy="8"  r="2.75" />
            <circle cx="31"   cy="9"  r="2.75" />
            <circle cx="39"   cy="12" r="2.75" />
        </g>
        <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" style="stroke-linecap:butt; stroke:#000000;" />
        <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" style="stroke-linecap:butt;" />
        <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style="fill:none; stroke:#000000; stroke-linecap:butt;" />
        <path d="M 11,29 A 35,35 1 0 1 34,29" style="fill:none; stroke:#ffffff;" />
        <path d="M 12.5,31.5 L 32.5,31.5" style="fill:none; stroke:#ffffff;" />
        <path d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" style="fill:none; stroke:#ffffff;" />
        <path d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" style="fill:none; stroke:#ffffff;" />
    </g>
    <g style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(90,45)">
        <g style="fill:#000000; stroke:#000000; stroke-linecap:butt;"> 
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
        </g>
        <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#ffffff; stroke-linejoin:miter;" />
    </g>
    <g style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(135,45)">
        <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#000000; stroke:#000000;" />
        <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#000000; stroke:#000000;" />
        <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#ffffff; stroke:#ffffff;" />
        <path d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#ffffff; stroke:#ffffff;" />
        <path d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z " style="fill:#ffffff; stroke:none;" />
    </g>
    <g style="opacity:1; fill:000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(180,45)">
        <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
        <path d="M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z " style="stroke-linecap:butt;" />
        <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
        <path d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z " style="stroke-linecap:butt;stroke-linejoin:miter;" />
        <path d="M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z " style="stroke-linecap:butt;" />
        <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z " style="stroke-linecap:butt;" />
        <path d="M 12,35.5 L 33,35.5 L 33,35.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 13,31.5 L 32,31.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 14,29.5 L 31,29.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 14,16.5 L 31,16.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
        <path d="M 11,14 L 34,14" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
    </g>
    <g transform="translate(225,45)">
        <path d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z " style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" />
    </g>
</svg>`;

// --- HELPER FUNCTIONS ---

const toAlgebraic = (x, y) => {
    const col = String.fromCharCode(97 + x); // 0='a', 1='b'
    const row = 8 - y; // y=0 is rank 8, y=7 is rank 1
    return `${col}${row}`;
};

const fromAlgebraic = (coord) => {
    if (coord.length < 2) return null;
    const colChar = coord[0].toLowerCase();
    const rowChar = coord[1];

    const x = colChar.charCodeAt(0) - 97;
    const y = 8 - parseInt(rowChar, 10);

    if (x < 0 || x > 7 || y < 0 || y > 7 || isNaN(y)) return null;
    return { x, y };
};

// Initial setup
const getInitialBoard = () => {
    const pieces = [];
    pieces.push({ id: 'k1', type: 'king', owner: 'player', x: 4, y: 4, hasMoved: false });
    return pieces;
};

// Check valid moves
const getValidMoves = (piece, pieces) => {
    const moves = [];
    const { x, y, type, owner } = piece;
    const directions = [];

    const isOccupied = (tx, ty) => pieces.find(p => p.x === tx && p.y === ty);
    const isEnemy = (tx, ty) => {
        const target = isOccupied(tx, ty);
        return target && target.owner !== owner;
    };

    if (type === 'pawn') {
        const dir = owner === 'player' ? -1 : 1;
        if (!isOccupied(x, y + dir)) {
            moves.push({ x, y: y + dir });
        }
        [[x - 1, y + dir], [x + 1, y + dir]].forEach(([tx, ty]) => {
            if (tx >= 0 && tx < 8 && ty >= 0 && ty < 8 && isEnemy(tx, ty)) {
                moves.push({ x: tx, y: ty });
            }
        });
    }

    if (type === 'knight') {
        [[x + 1, y + 2], [x + 1, y - 2], [x - 1, y + 2], [x - 1, y - 2],
        [x + 2, y + 1], [x + 2, y - 1], [x - 2, y + 1], [x - 2, y - 1]].forEach(([tx, ty]) => {
            if (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
                const occ = isOccupied(tx, ty);
                if (!occ || occ.owner !== owner) moves.push({ x: tx, y: ty });
            }
        });
    }

    if (['rook', 'bishop', 'queen'].includes(type)) {
        if (type === 'rook' || type === 'queen') {
            directions.push([0, 1], [0, -1], [1, 0], [-1, 0]);
        }
        if (type === 'bishop' || type === 'queen') {
            directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        }

        directions.forEach(([dx, dy]) => {
            let tx = x + dx;
            let ty = y + dy;
            while (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
                const occ = isOccupied(tx, ty);
                if (occ) {
                    if (occ.owner !== owner) moves.push({ x: tx, y: ty });
                    break; // Blocked
                }
                moves.push({ x: tx, y: ty });
                tx += dx;
                ty += dy;
            }
        });
    }

    if (type === 'king') {
        [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
            const tx = x + dx;
            const ty = y + dy;
            if (tx >= 0 && tx < 8 && ty >= 0 && ty < 8) {
                const occ = isOccupied(tx, ty);
                if (!occ || occ.owner !== owner) moves.push({ x: tx, y: ty });
            }
        });
    }

    return moves;
};

// --- MAIN COMPONENT ---
const ChessSiege = () => {
    const canvasRef = useRef(null);
    const [spriteImage, setSpriteImage] = useState(null);

    // Game State
    const [pieces, setPieces] = useState(getInitialBoard());
    const [wave, setWave] = useState(1);
    const [points, setPoints] = useState(40);
    const [phase, setPhase] = useState('SHOP');
    const [turnKills, setTurnKills] = useState(0);
    const [selectedPieceId, setSelectedPieceId] = useState(null);
    const [placementType, setPlacementType] = useState(null);
    const [pawnsBought, setPawnsBought] = useState(0);
    const [message, setMessage] = useState("Welcome to Chess Siege!");
    const [animating, setAnimating] = useState(false);

    // New State for Wave Steps
    const [waveTurnCount, setWaveTurnCount] = useState(0);
    const [currentWaveDuration, setCurrentWaveDuration] = useState(0);

    // Load Sprites on mount
    useEffect(() => {
        const img = new Image();
        const svgData = encodeURIComponent(CHESS_SPRITE_SVG);
        img.src = `data:image/svg+xml;charset=utf-8,${svgData}`;
        img.onload = () => {
            setSpriteImage(img);
        };
    }, []);

    // --- RENDERING ---
    const drawBoard = (ctx) => {
        ctx.clearRect(0, 0, TILE_SIZE * 8, TILE_SIZE * 8);

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const isDark = (row + col) % 2 === 1;
                ctx.fillStyle = isDark ? '#769656' : '#eeeed2';
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                if (col === 0) {
                    ctx.fillStyle = isDark ? '#eeeed2' : '#769656';
                    ctx.font = '10px Arial';
                    ctx.fillText(8 - row, 2, row * TILE_SIZE + 12);
                }
                if (row === 7) {
                    ctx.fillStyle = isDark ? '#eeeed2' : '#769656';
                    ctx.fillText(String.fromCharCode(65 + col), col * TILE_SIZE + 54, 510);
                }
            }
        }

        if (selectedPieceId && phase === 'BATTLE_PLAYER') {
            const p = pieces.find(x => x.id === selectedPieceId);
            if (p && !p.hasMoved) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.fillRect(p.x * TILE_SIZE, p.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                const moves = getValidMoves(p, pieces);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                moves.forEach(m => {
                    ctx.beginPath();
                    ctx.arc(m.x * TILE_SIZE + 32, m.y * TILE_SIZE + 32, 10, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        }

        if (phase === 'PLACEMENT') {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            for (let y = 4; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                    if (!pieces.find(p => p.x === x && p.y === y)) {
                        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }

        if (spriteImage) {
            pieces.forEach(p => {
                ctx.save();
                if (p.hasMoved && phase === 'BATTLE_PLAYER') ctx.globalAlpha = 0.6;

                let srcX = SPRITE_OFFSETS[p.type];
                if (srcX === undefined) srcX = 225;
                const srcY = p.owner === 'player' ? 0 : 45;

                ctx.drawImage(
                    spriteImage,
                    srcX, srcY,
                    SPRITE_TILE_SIZE, SPRITE_TILE_SIZE,
                    p.x * TILE_SIZE, p.y * TILE_SIZE,
                    TILE_SIZE, TILE_SIZE
                );
                ctx.restore();
            });
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            drawBoard(ctx);
        }
    }, [pieces, selectedPieceId, phase, placementType, spriteImage]);


    // --- GAME LOGIC ACTIONS ---

    // DEBUG STATES
    const [debugMode, setDebugMode] = useState(false);
    const [debugColor, setDebugColor] = useState('enemy'); // 'player' or 'enemy'
    const [debugType, setDebugType] = useState('pawn');
    const [debugCoord, setDebugCoord] = useState('');
    const [isEyedropperActive, setIsEyedropperActive] = useState(false);

    const handleCanvasClick = (e) => {
        // 1. Calculate Grid Coordinates
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

        // 2. DEBUG EYEDROPPER INTERCEPTION
        if (isEyedropperActive) {
            setDebugCoord(toAlgebraic(x, y));
            setIsEyedropperActive(false); // Turn off eyedropper after selection
            return; // Stop normal game logic
        }

        // 3. Normal Game Logic
        if (animating) return;

        if (phase === 'PLACEMENT') {
            placePiece(x, y);
        } else if (phase === 'BATTLE_PLAYER') {
            handleBattleClick(x, y);
        }
    };

    const buyPiece = (type) => {
        if (points >= PIECE_VALUES[type]) {
            if (type === 'pawn' && pawnsBought >= 3) {
                setMessage("Max 3 pawns per round!");
                return;
            }
            setPlacementType(type);
            setPhase('PLACEMENT');
            setMessage(`Place your ${type} on the bottom half.`);
        } else {
            setMessage("Not enough points!");
        }
    };

    const placePiece = (x, y) => {
        if (y < 4) {
            setMessage("Must place on your half!");
            return;
        }
        if (pieces.find(p => p.x === x && p.y === y)) {
            setMessage("Square occupied!");
            return;
        }

        setPoints(prev => prev - PIECE_VALUES[placementType]);
        if (placementType === 'pawn') setPawnsBought(prev => prev + 1);

        const newPiece = {
            id: `p-${Date.now()}`,
            type: placementType,
            owner: 'player',
            x, y,
            hasMoved: false
        };

        setPieces([...pieces, newPiece]);
        setPlacementType(null);
        setPhase('SHOP');
        setMessage("Buy more or Start Battle.");
    };

    const handleBattleClick = (x, y) => {
        const clickedPiece = pieces.find(p => p.x === x && p.y === y);

        if (clickedPiece && clickedPiece.owner === 'player') {
            if (clickedPiece.hasMoved) return;
            setSelectedPieceId(clickedPiece.id);
            return;
        }

        if (selectedPieceId) {
            const piece = pieces.find(p => p.id === selectedPieceId);
            const validMoves = getValidMoves(piece, pieces);
            const move = validMoves.find(m => m.x === x && m.y === y);

            if (move) {
                executeMove(piece, x, y);
            } else {
                setSelectedPieceId(null);
            }
        }
    };

    const executeMove = (piece, tx, ty) => {
        const target = pieces.find(p => p.x === tx && p.y === ty);
        let newPieces = pieces.filter(p => p.id !== piece.id); // Remove mover from old spot
        let pointsGained = 0;
        let currentTurnKills = turnKills; // Local var to calculate combos correctly

        // Capture Logic
        if (target) {
            // Remove target
            newPieces = newPieces.filter(p => p.id !== target.id);
            // Base Reward
            const reward = KILL_REWARDS[target.type] || 0;
            pointsGained += reward;

            // Combo System
            currentTurnKills += 1;
            setTurnKills(currentTurnKills);

            let comboText = "";

            if (currentTurnKills === 2) {
                pointsGained += 5;
                comboText = " (Double Kill +5)";
            } else if (currentTurnKills === 3) {
                pointsGained += 5;
                comboText = " (Triple Kill +5)";
            } else if (currentTurnKills > 3) {
                pointsGained += 10;
                comboText = " (Multi Kill +10)";
            }

            setMessage(`Killed ${target.type} +${reward}${comboText}`);
        }

        // Pawn Promotion / Sacrifice Logic
        if (piece.type === 'pawn' && ty === 0) {
            pointsGained += 20;
            setMessage("Pawn Sacrificed! +20 Points");
            // Logic: We simply do NOT push the piece back into newPieces. 
            // It was removed at the start of the function, so now it stays removed.
        } else {
            // Normal Move: Add piece back at new location
            newPieces.push({ ...piece, x: tx, y: ty, hasMoved: true });
        }

        setPoints(prev => prev + pointsGained);
        setPieces(newPieces);
        setSelectedPieceId(null);
    };

    const startBattle = () => {
        if (phase === 'SHOP') {
            spawnWave();
        }
    };

    const spawnWave = () => {
        if (wave > 20) {
            setPhase('VICTORY');
            return;
        }

        const currentWaveData = WAVES[wave - 1];

        // Local copy to handle modifications during calculation
        let nextPieces = [...pieces];
        const newEnemies = [];
        let kingKilledInSpawn = false;

        // Spawn Logic
        for (let i = 0; i < currentWaveData.units.length; i++) {
            const enemyDef = currentWaveData.units[i];
            const col = enemyDef.col;

            let spawnY = -1;

            // Iterative/Recursive check from Rank 8 (y=0) downwards
            for (let y = 0; y < 8; y++) {
                const occupantIndex = nextPieces.findIndex(p => p.x === col && p.y === y);
                const occupant = occupantIndex !== -1 ? nextPieces[occupantIndex] : null;

                if (!occupant) {
                    // Found Empty Square -> Spawn here
                    spawnY = y;
                    break;
                } else if (occupant.owner === 'player') {
                    // Found Player Piece
                    if (occupant.type === 'king') {
                        kingKilledInSpawn = true;
                    }
                    // Kill the player piece
                    nextPieces.splice(occupantIndex, 1);
                    // Spawn here
                    spawnY = y;
                    break;
                } else if (occupant.owner === 'enemy') {
                    // Found Enemy Piece -> Continue loop to check next square (y+1)
                    continue;
                }
            }

            // If we found a valid spot (and didn't run off the board)
            if (spawnY !== -1) {
                newEnemies.push({
                    id: `e-w${wave}-${i}-${Date.now()}`,
                    type: enemyDef.type,
                    owner: 'enemy',
                    x: col,
                    y: spawnY,
                    hasMoved: false
                });
            }
        }

        if (kingKilledInSpawn) {
            setPieces(nextPieces); // Update to show the empty king spot
            setPhase('GAME_OVER');
            setMessage("Ambush! King killed during reinforcement.");
            return;
        }

        // Final Update
        const finalBoard = [...nextPieces, ...newEnemies].map(p => ({ ...p, hasMoved: false }));
        setPieces(finalBoard);

        setPhase('BATTLE_PLAYER');
        setMessage(`Wave ${wave} Started! Survive ${currentWaveData.duration} steps.`);

        setTurnKills(0);
        setPawnsBought(0);
        setWaveTurnCount(0);
        setCurrentWaveDuration(currentWaveData.duration);
    };

    const endPlayerTurn = () => {
        setPhase('BATTLE_ENEMY');
    };

    useEffect(() => {
        if (phase === 'BATTLE_ENEMY') {
            setAnimating(true);
            setTimeout(() => {
                processEnemyTurn();
            }, 500);
        }
    }, [phase]);

    const processEnemyTurn = () => {
        let currentPieces = [...pieces];
        const enemies = currentPieces.filter(p => p.owner === 'enemy');
        let kingCaptured = false;
        let lossPenalty = 0;

        // Enemy AI
        enemies.sort((a, b) => b.y - a.y);

        const newPiecesState = [...currentPieces];

        enemies.forEach(enemy => {
            const liveEnemy = newPiecesState.find(p => p.id === enemy.id);
            if (!liveEnemy) return;

            const moves = getValidMoves(liveEnemy, newPiecesState);

            if (moves.length === 0) return;

            const killKing = moves.find(m => {
                const target = newPiecesState.find(p => p.x === m.x && p.y === m.y);
                return target && target.type === 'king';
            });

            if (killKing) {
                kingCaptured = true;
                return;
            }

            moves.sort((a, b) => {
                const tA = newPiecesState.find(p => p.x === a.x && p.y === a.y);
                const tB = newPiecesState.find(p => p.x === b.x && p.y === b.y);
                const valA = tA ? PIECE_VALUES[tA.type] : 0;
                const valB = tB ? PIECE_VALUES[tB.type] : 0;
                if (valA !== valB) return valB - valA;
                return b.y - a.y;
            });

            const bestMove = moves[0];
            const target = newPiecesState.find(p => p.x === bestMove.x && p.y === bestMove.y);

            if (target) {
                const idx = newPiecesState.findIndex(p => p.id === target.id);
                newPiecesState.splice(idx, 1);
            }

            const enemyIdx = newPiecesState.findIndex(p => p.id === liveEnemy.id);
            newPiecesState[enemyIdx] = { ...liveEnemy, x: bestMove.x, y: bestMove.y };

            if (liveEnemy.type === 'pawn' && bestMove.y === 7) {
                lossPenalty += 10;
                newPiecesState.splice(enemyIdx, 1);
            }
        });

        // --- END OF ENEMY TURN LOGIC ---

        if (kingCaptured) {
            setPhase('GAME_OVER');
            setMessage("Your King has fallen!");
        } else {
            setPoints(prev => Math.max(0, prev - lossPenalty));
            if (lossPenalty > 0) setMessage(`Breach! Lost ${lossPenalty} points.`);

            setPieces(newPiecesState);
            setAnimating(false);

            // --- CHECK WAVE CONDITION ---
            // 1. Are enemies all dead?
            // 2. Has time (steps) run out?

            const enemiesAlive = newPiecesState.filter(p => p.owner === 'enemy').length > 0;
            const nextTurnCount = waveTurnCount + 1;

            if (!enemiesAlive) {
                // Condition A: All dead. Wave Clear.
                setWave(prev => prev + 1);
                setPhase('SHOP');
                setMessage("Wave Cleared! Shop Open.");
            } else if (nextTurnCount >= currentWaveDuration) {
                // Condition B: Time is up. Wave End (Surviving enemies stay).
                setWave(prev => prev + 1);
                setPhase('SHOP');
                setMessage("Wave Survived! Shop Open.");
            } else {
                // Condition C: Continue Fighting
                setWaveTurnCount(nextTurnCount);
                setPhase('BATTLE_PLAYER');
                // Reset Player movement flags for next turn
                setPieces(prev => prev.map(p => ({ ...p, hasMoved: false })));
                setTurnKills(0);
            }
        }
    };

    const forceSpawnPiece = () => {
        const coords = fromAlgebraic(debugCoord);
        if (!coords) {
            alert("Invalid Coordinate! Use format 'e4' or eyedropper.");
            return;
        }

        const { x, y } = coords;

        // Remove any piece currently at that location
        const filteredPieces = pieces.filter(p => !(p.x === x && p.y === y));

        const newPiece = {
            id: `debug-${Date.now()}`,
            type: debugType,
            owner: debugColor,
            x, y,
            hasMoved: false
        };

        setPieces([...filteredPieces, newPiece]);
        setMessage(`Debug: Spawned ${debugColor} ${debugType} at ${debugCoord}`);
    };

    return (
        <div style={{ display: 'flex', gap: '20px', padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#333', color: 'white', minHeight: '100vh', justifyContent: 'center' }}>

            {/* GAME BOARD */}
            <div>
                <canvas
                    ref={canvasRef}
                    width={TILE_SIZE * 8}
                    height={TILE_SIZE * 8}
                    onClick={handleCanvasClick}
                    style={{ border: '4px solid #555', cursor: 'pointer', backgroundColor: '#eeeed2' }}
                />
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    {phase === 'BATTLE_PLAYER' && (
                        <button
                            onClick={endPlayerTurn}
                            style={{ padding: '10px 20px', fontSize: '16px', background: '#d9534f', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                        >
                            End Turn (Enemy Move)
                        </button>
                    )}
                </div>
            </div>

            {/* SIDEBAR UI */}
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#444', padding: '15px', borderRadius: '8px' }}>
                    <h2 style={{ margin: 0 }}>Chess Siege</h2>
                    <p style={{ color: '#aaa', fontSize: '14px' }}>Defend E4 King</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
                        <span>Wave: {wave}/20</span>
                        <span style={{ color: '#f0ad4e' }}>pts: {points}</span>
                    </div>

                    {/* WAVE PROGRESS */}
                    {(phase === 'BATTLE_PLAYER' || phase === 'BATTLE_ENEMY') && (
                        <div style={{ marginTop: '10px', background: '#222', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
                            <small style={{ color: '#aaa' }}>Steps Remaining</small>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                {currentWaveDuration === 999 ? '∞' : (currentWaveDuration - waveTurnCount)}
                            </div>
                        </div>
                    )}

                    <div style={{ background: '#222', padding: '10px', marginTop: '10px', borderRadius: '4px', minHeight: '40px' }}>
                        {message}
                    </div>
                </div>

                {/* SHOP */}
                <div style={{ background: '#444', padding: '15px', borderRadius: '8px', opacity: phase === 'SHOP' ? 1 : 0.5, pointerEvents: phase === 'SHOP' ? 'auto' : 'none' }}>
                    <h3>Shop</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button onClick={() => buyPiece('pawn')} disabled={pawnsBought >= 3} style={shopBtnStyle}>
                            Pawn (10) <br /><small>{pawnsBought}/3</small>
                        </button>
                        <button onClick={() => buyPiece('knight')} style={shopBtnStyle}>Knight (30)</button>
                        <button onClick={() => buyPiece('bishop')} style={shopBtnStyle}>Bishop (30)</button>
                        <button onClick={() => buyPiece('rook')} style={shopBtnStyle}>Rook (40)</button>
                        <button onClick={() => buyPiece('queen')} style={shopBtnStyle}>Queen (60)</button>
                    </div>
                    {phase === 'SHOP' && (
                        <button
                            onClick={startBattle}
                            style={{ width: '100%', marginTop: '15px', padding: '15px', background: '#5cb85c', color: 'white', border: 'none', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
                        >
                            START WAVE {wave}
                        </button>
                    )}
                </div>

                {/* INFO */}
                <div style={{ background: '#444', padding: '15px', borderRadius: '8px', fontSize: '12px', color: '#ccc' }}>
                    <h4>Rules:</h4>
                    <ul>
                        <li>Place units on bottom half.</li>
                        <li>Survive X steps OR kill all enemies to finish wave.</li>
                        <li>Wave 20 must be cleared completely.</li>
                        <li>Kill Pawn: +5 | Minor: +15 | Rook: +20 | Queen: +30</li>
                        <li>Double Kill: +5 bonus</li>
                    </ul>
                </div>

                {phase === 'GAME_OVER' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <h1 style={{ color: 'red', fontSize: '48px' }}>DEFEAT</h1>
                        <button onClick={() => window.location.reload()} style={{ padding: '20px', fontSize: '24px' }}>Try Again</button>
                    </div>
                )}

                {phase === 'VICTORY' && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <h1 style={{ color: 'gold', fontSize: '48px' }}>VICTORY!</h1>
                        <p>You survived the Siege.</p>
                        <button onClick={() => window.location.reload()} style={{ padding: '20px', fontSize: '24px' }}>Play Again</button>
                    </div>
                )}

            </div>

            {/* DEBUG MENU */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #666', paddingTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={debugMode}
                        onChange={(e) => setDebugMode(e.target.checked)}
                    />
                    Debug Mode
                </label>

                {debugMode && (
                    <div style={{ background: '#222', padding: '10px', marginTop: '10px', borderRadius: '4px', border: '1px solid #d9534f' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#d9534f' }}>Force Spawn</h4>

                        {/* Color Toggle */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <label><input type="radio" name="dColor" checked={debugColor === 'player'} onChange={() => setDebugColor('player')} /> White</label>
                            <label><input type="radio" name="dColor" checked={debugColor === 'enemy'} onChange={() => setDebugColor('enemy')} /> Black</label>
                        </div>

                        {/* Type Selector */}
                        <select
                            value={debugType}
                            onChange={(e) => setDebugType(e.target.value)}
                            style={{ width: '100%', padding: '5px', marginBottom: '10px', background: '#333', color: 'white', border: '1px solid #555' }}
                        >
                            {Object.keys(PIECE_VALUES).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        {/* Coordinate Input & Eyedropper */}
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                            <input
                                type="text"
                                placeholder="e.g. e4"
                                value={debugCoord}
                                onChange={(e) => setDebugCoord(e.target.value)}
                                style={{ width: '60px', padding: '5px' }}
                            />
                            <button
                                onClick={() => setIsEyedropperActive(!isEyedropperActive)}
                                style={{
                                    flex: 1,
                                    cursor: 'pointer',
                                    background: isEyedropperActive ? '#f0ad4e' : '#555',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                {isEyedropperActive ? 'Click Board' : 'Select'}
                            </button>
                        </div>

                        <button
                            onClick={forceSpawnPiece}
                            style={{ width: '100%', padding: '8px', background: '#d9534f', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                        >
                            SPAWN
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const shopBtnStyle = {
    padding: '10px',
    cursor: 'pointer',
    backgroundColor: '#555',
    color: 'white',
    border: '1px solid #777',
    borderRadius: '4px'
};

export default ChessSiege;