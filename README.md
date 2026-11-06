# Tengu

A 2D side-scrolling RPG you can play with friends.

- **Play:** https://ikage24-wq.github.io/Tengu/
- **Windows:** [Releases](https://github.com/ikage24-wq/Tengu/releases) (updates itself)

```sh
npm start         # http://localhost:8000 (PORT=8123 npm start for another port)
npm test
npm run dist      # build the .exe
npm run release   # publish an update (needs GH_TOKEN)
```

`npm start` runs a tiny server with no packages (`tools/serve.mjs`). It tells the browser to check
every file is current before using its saved copy, so after an update a returning player gets the
new game rather than a blank screen from a mix of old and new files. Unchanged files still load
from the browser's copy.
