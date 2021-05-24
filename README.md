## Differences compared to [Download with Aria2 Chromium](https://github.com/jc3213/download_with_aria2-chromium)

- It uses `downloads.onCreated` on Firefox, which is similar but different compares to `downloads.onDeterminingFilename` on Chromium
    - Sometimes small files (less than 10MB) will be downloaded by Firefox before they can be cancelled
    - Firefox will show notifications about them, and will not send the jsonrpc requests to Aria2
    - Downloads will be cancelled first, then removed from `Download History`
- Exclusive feature: Setting download folder with `3` options
    - 1 `Default` - Aria2 download folder
    - 2 `Browser` - Browser download folder (only for capturing, non-capturing downloads will fall back to 1)
    - 3 `Custom`  - Custom folder (if custom folder is value is `""`, fall back to 1)
- Since I can't pass through the two-factor authentication of my Firefox Account [Reference](https://github.com/jc3213/download_with_aria2-firefox/issues/19#issuecomment-836499513), you can try [this one provided by @ivysrono](https://addons.mozilla.org/en-US/firefox/addon/download-with-aria2/)
