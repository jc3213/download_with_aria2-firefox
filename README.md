## Differences compared to [Download with Aria2 Chromium](https://github.com/jc3213/download_with_aria2-chromium)

- Published on [AMO](https://addons.mozilla.org/en-US/firefox/addon/downwitharia2/)

- Moved to `downloads.onCreated` event handler, which is similar to `downloads.onDeterminingFilename` on Chrome, but with some differences
- Exclusive feature: Setting download folder with `3` options
    - 1 `Default` - Aria2 download folder
    - 2 `Browser` - Browser download folder (only for capturing, non-capturing downloads will fall back to 1)
    - 3 `Custom`  - Custom folder (if custom folder is value is `""`, fall back to 1)
- Cancel the download first before removing it from history to prevent downloading the file twice
- Changed all `chrome` usaeg to `browser` for Firefox
- To avoid duplicated download from Firefox while using `Capturing` feature, please check `Always ask you where to save files` in Firefox Options
