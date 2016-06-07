# RocketBeansTV Chatbarometer

A rough-and-dirty experiment to read a twitch chat in realtime, searching each incoming message for a predefined set of emoticons, and if found, a measuring event is triggered and displayed on the screen.

***

If you want to tinker and play with it:
### 0.5 Requirements
- You'll need to have node.js and npm (comes by default with node.js) installed on your system
- Install node-sass:

        $ npm install -g node-sass
- Install browserify:

        $ npm install -g browserify

### 1. Initialisation
- Clone this repo or download the ZIP
- In the repo root dir, open a shell and run:

        $ npm install
    (This will download the "Measured" javascript library, which is required for the script to run)

### 2. Edit the CSS
- Edit css/style.scss (SASS file)
- After editing, convert it to regular CSS: in the repo root dir, open a shell and run:

        $ node-sass css/style.scss css/style.min.css --output-style compressed

### 3. Edit the JS
- The main page functions are inside the file js/main.js, edit it however you like
- After editing, in the repo root dir, open a shell and run:

        $ browserify js/main.js > js/bundle.js
        
***

#### This experiment uses:
- tmi.js to connect to and parse from the Twitch Chat
- D3.js for the graph
- Rickshaw.js for the graph
- Twitter Bootstrap v3
- Measured (JS library to measure events)
