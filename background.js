browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2firefox',
    contexts: ['link'],
    onclick: (info, tab) => {
        downWithAria2({url: info.linkUrl, referer: tab.url, domain: domainFromUrl(tab.url)});
    }
});

browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install' || details.previousVersion < '2.4000') {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/components/options.json', true);
        xhr.onload = () => restoreSettings(xhr.response, details.reason);
        xhr.send();
        // special wrapper since preference has been changed
        localStorage['folder'] = localStorage['directory'] || '';
        localStorage.removeItem('directory');
    }
});

browser.downloads.onCreated.addListener((item) => {
    if (localStorage['capture'] === '0' || item.url.match(/^(blob|data)/)) {
        return;
    }

    var session = {url: item.url, options: {out: item.filename.split(/[\/\\]+/).pop()}};
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        session.folder = item.filename.replace(session.options.out, '');
        session.referer = item.referrer || tabs[0].url;
        session.domain = domainFromUrl(session.referer);
        if (localStorage['capture'] === '2') {
            return captureDownload();
        }
        if (localStorage['ignored'].includes(session.domain)) {
            return;
        }
        if (localStorage['monitored'].includes(session.domain)) {
            return captureDownload();
        }
        if (localStorage['fileExt'].includes(item.filename.split('.').pop())) {
            return captureDownload();
        }
        if (localStorage['fileSize'] > 0 && item.fileSize >= localStorage['fileSize']) {
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
