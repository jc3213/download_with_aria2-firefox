browser.contextMenus.create({
    'title': browser.i18n.getMessage('extension_name'),
    'id': 'downwitharia2firefox',
    'contexts': ['link']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2firefox') {
        downWithAria2({'url': info.linkUrl, 'referer': tab.url, 'domain': domainFromUrl(tab.url)});
    }
});

browser.downloads.onCreated.addListener((item) => {
    if (item.url.startsWith('blob')) {
        return;
    }
    var capture = (localStorage.getItem('capture') | 0);
    if (capture > 0) {
        if (item.referrer) {
            captureAdd(capture, item);
        }
        else {
            browser.tabs.query({'active': true, 'currentWindow': true}, (tabs) => {
                item.referrer = tabs[0].url;
                captureAdd(capture, item);
            });
        }
    }

    function captureAdd(capture, item) {
        var domain = domainFromUrl(item.referrer);
        var check = captureCheck(domain, item.filename.split('.').pop(), item.fileSize);
        if (capture === 2 || check) {
            browser.downloads.cancel(item.id, () => {
                browser.downloads.erase({'id': item.id}, () => {
                    downWithAria2({'url': item.url, 'referer': item.referrer, 'domain': domain, 'filename': item.filename.match(/[^\\]+$/i)[0], 'path': item.filename.replace(/[^\\]+$/i, '')});
                });
            });
        }
    }

    function captureCheck(domain, ext, size) {
        var ignored = localStorage.getItem('ignored');
        if (ignored && ignored.includes(domain)) {
            return false;
        }
        var monitored = localStorage.getItem('monitored');
        if (monitored && monitored.includes(domain)) {
            return true;
        }
        var fileExt = localStorage.getItem('fileExt');
        if (fileExt && fileExt.includes(ext)) {
            return true;
        }
        var fileSize = localStorage.getItem('fileSize');
        if (fileSize > 0 && size >= fileSize) {
            return true;
        }
        return false;
    }
});
