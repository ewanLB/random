# Random Selector Wheel

This project is a simple random selection wheel implemented in HTML5 and JavaScript.
It allows you to define your own options, store them in the browser's local storage,
and spin a wheel to randomly choose one.

## Features

- Stylish wheel with animated pointer
- Sound effects for spinning and celebrating
- Options can be toggled on/off without deletion
- Each option is displayed with a random emoji icon
- Results are shown in a pop-up modal
- Save sets of options into named groups for later loading
- Uses `window.crypto.getRandomValues` for stronger randomness

Open `index.html` in a browser or deploy it via GitHub Pages to use it.

## Icons

The wheel uses the following emoji icons by default:

🍀 🌟 🍭 🍉 🍣 🧩 🎈 🐱 🐶 🐻

You can replace them by editing the `ICONS` array in `wheel.js` or by
changing each option's icon directly in the list.
