browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2firefox',
    contexts: ['link'],
    onclick: (info, tab) => {
        downWithAria2({url: info.linkUrl, referer: tab.url, host: new URL(tab.url).hostname});
    }
});

browser.runtime.onInstalled.addListener((details) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/components/options.json', true);
    xhr.onload = () => {
        restoreSettings(xhr.response);
    };
    xhr.send();
});

browser.downloads.onCreated.addListener((item) => {
    if (localStorage['capture'] === '0' || item.url.startsWith('blob') || item.url.startsWith('data')) {
        return;
    }

    var session = {url: item.url, filename: item.filename.match(/[^\/\\]+$/)[0]};
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        session.folder = item.filename.replace(session.filename, '');
        session.referer = item.referrer || tabs[0].url;
        session.host = new URL(session.referer).hostname;
        if (localStorage['capture'] === '2') {
            return captureDownload();
        }
        if (localStorage['ignored'].includes(session.host)) {
            return;
        }
        if (localStorage['monitored'].includes(session.host)) {
            return captureDownload();
        }
        if (localStorage['fileExt'].includes(item.filename.match(/[^\.]+$/)[0])) {
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
    );
}

browser.browserAction.setBadgeBackgroundColor({color: '#3CC'});
displayActiveTaskNumber();
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
