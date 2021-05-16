## Differences compared to [Download with Aria2 Chromium](https://github.com/jc3213/download_with_aria2-chromium)

- Firefox uses `downloads.onCreated` API, which is similar but different with `downloads.onDeterminingFilename` on Chrome
    - Sometimes small files (Less than 10MB) will be downloaded by Firefox before it is cancelled
    - Firefox will show notifications about these downloads, and won't send the jsonrpc requests to Aria2
- Exclusive feature: Setting download folder with `3` options
    - 1 `Default` - Aria2 download folder
    - 2 `Browser` - Browser download folder (only for capturing, non-capturing downloads will fall back to 1)
    - 3 `Custom`  - Custom folder (if custom folder is value is `""`, fall back to 1)
- Cancel the download first before removing it from history to prevent downloading the file twice
- Changed all `chrome` usaeg to `browser` for Firefox
