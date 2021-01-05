## Differences compared to [Download with Aria2 Chromium](https://github.com/jc3213/download_with_aria2-chromium)

- Published on [AMO](https://addons.mozilla.org/en-US/firefox/addon/downwitharia2/)

- Moved to `downloads.onCreated` event handler, but works the same as `downloads.onDeterminingFilename` on Chrome
- Exclusive feature: Setting download folder with `3` options
    - 1 Default (Aria2 download folder)
    - 2 Browser (Browser download folder)
    - 3 Custom (Custom folder), if custom folder is `EMPTY`, return 1
- Cancel the download first before removing it from history to prevent downloading the file twice
- Changed all `chrome` to `browser` for Firefox
