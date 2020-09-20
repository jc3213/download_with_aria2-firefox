browser.contextMenus.create({
    'title': browser.i18n.getMessage('extension_name'),
    'id': 'downwitharia2firefox',
    'contexts': ['link']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2firefox') {
        downWithAria2(info.linkUrl, null, tab.url);
    }
});

browser.downloads.onCreated.addListener((item) => {
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
        var check = captureCheck(domainFromUrl(item.referrer), item.filename.split('.').pop());
        if (capture === 2 || check) {
            browser.downloads.cancel(item.id, () => {
                browser.downloads.erase({ id: item.id }, () => {
                    var lastPathSeparator = Math.max(item.filename.lastIndexOf('/'), item.filename.lastIndexOf('\\'));
                    var itemDir = lastPathSeparator == -1 ? null : item.filename.substr(0, lastPathSeparator);
                    downWithAria2(item.url, itemDir, item.referrer)
                })
            })
        }
    }

    function captureCheck(domain, ext) {
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
        return false;
    }
});
