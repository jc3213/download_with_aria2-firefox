browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2firefox',
    contexts: ['link'],
    onclick: (info, tab) => {
        downWithAria2({url: info.linkUrl, referer: tab.url, domain: domainFromUrl(tab.url)});
    }
});

browser.downloads.onCreated.addListener((item) => {
    var capture = localStorage.getItem('capture') | 0;
    if (capture === 0 || item.url.match(/^(blob|data)/)) {
        return;
    }

    var session = {url: item.url, options: {out: item.filename.split(/[\/\\]+/).pop()}};
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        session.folder = item.filename.replace(session.options.out, '');
        session.referer = item.referrer || tabs[0].url;
        session.domain = domainFromUrl(session.referer);
        if (capture === 2) {
            return captureDownload();
        }
        var ignored = localStorage.getItem('ignored') || '';
        if (ignored.includes(session.domain)) {
            return;
        }
        var monitored = localStorage.getItem('monitored') || '';
        if (monitored.includes(session.domain)) {
            return captureDownload();
        }
        var fileExt = localStorage.getItem('fileExt') || '';
        if (fileExt.includes(item.filename.split('.').pop())) {
            return captureDownload();
        }
        var fileSize = localStorage.getItem('fileSize') | 0;
        if (fileSize !== 0 && item.fileSize >= fileSize && item.fileSize !== -1) {
            return captureDownload();
        }
    });

    function captureDownload() {
        browser.downloads.cancel(item.id, () => {
            browser.downloads.erase({id: item.id}, () => {
                downWithAria2(session);
            });
        });
    }
});

function displayActiveTaskNumber() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalStat'},
        (result) => {
            browser.browserAction.setBadgeText({text: result.numActive === '0' ? '' : result.numActive});
        }
    )
}

browser.browserAction.setBadgeBackgroundColor({color: '#3CC'});
displayActiveTaskNumber();
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
