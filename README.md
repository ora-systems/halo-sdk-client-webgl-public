# JS/WebGL Ora SDK Client

### Prerequisites

This project requires NodeJS 0.11.*.

### Installing dependencies

To install 3rd party libraries run the following command in the project folder.

```
npm install
```

### Building

```
browserify app/main.js --ignore-missing=plask -g brfs -o main.web.js
```

After that you should be able to open index.html. Depending on your browser local content policy you might need to upload index.html, main.web.js and assets folder to a server for them to load properly.