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
- One-click sharing: copy a link that carries your options to anyone else
- Uses `window.crypto.getRandomValues` for stronger randomness

Open `index.html` in a browser or deploy it via GitHub Pages to use it.

## Sharing

Options normally live only in your own browser's local storage, so other people
cannot see them. Press **Share** (or the 🔗 button next to a saved group) to get a
link with the options encoded in its `#s=` fragment, already copied to your
clipboard. On phones the native share sheet is offered too.

When someone opens that link the app asks before replacing their current options;
after loading, a shared group is also stored under its name so they can reload it
later. The fragment stays in the browser and is never sent to a server, so this
works on GitHub Pages with no backend. Very long lists make long links — some chat
apps truncate them, and a warning appears past ~4000 characters.

## Icons

The wheel uses the following emoji icons by default:

🍀 🌟 🍭 🍉 🍣 🧩 🎈 🐱 🐶 🐻

You can replace them by editing the `ICONS` array in `wheel.js` or by
changing each option's icon directly in the list.
