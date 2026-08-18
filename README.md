# Random Selector Wheel

This project is a simple random selection wheel implemented in HTML5 and JavaScript.
It allows you to define your own options, store them in the browser's local storage,
and spin a wheel to randomly choose one.

## Features

- Stylish wheel with animated pointer
- Sound effects for spinning and celebrating
- Options can be toggled on/off without deletion
- Each option gets its own emoji, changeable through a searchable picker
- Results are shown in a pop-up modal
- Save sets of options into named groups for later loading
- One-click sharing: copy a link that carries your options to anyone else
- Destructive actions (reset, delete a group, overwrite a saved name) ask first
- Keyboard and screen-reader friendly: every mode can be played without a mouse
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

Every option carries an emoji, drawn from a pool of ~190 grouped into **Faces,
Animals, Food, Play, Places, Nature** and **Things**. New options take an icon
nothing else is using, so a list only starts repeating past the size of the pool.

Click the emoji button on any row to open the picker: search by keyword
(`noodle`, `luck`, `cat`) or by group name, hit **Random** for an unused one,
**None** for no icon at all, or type/paste your own in the field at the bottom —
handy for flags, letters, or anything the pool doesn't cover. The grid takes
arrow keys, Enter picks the first search match, and Escape closes.

To change the pool itself, edit `ICON_GROUP_SOURCE` in `wheel.js`. Each entry is
`"emoji keyword keyword…"`, where the keywords are what the search box matches.
Stick to single code point emoji: icons travel inside share links, which cap each
one at four UTF-16 units.
