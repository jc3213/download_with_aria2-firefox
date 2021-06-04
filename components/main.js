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
    xhr.responseType = 'json';
    xhr.onload = () => {
        Object.keys(xhr.response).forEach(key => {
            if (!localStorage[key]) {
                localStorage[key] = xhr.response[key];
            }
        });
    };
    xhr.send();
});

browser.downloads.onCreated.addListener((item) => {
    if (localStorage['capture'] === '0' || item.url.startsWith('blob') || item.url.startsWith('data')) {
        return;
    }

    var session = {url: item.url, filename: getFileName(item.filename)};
    browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
        session.folder = item.filename.slice(0, item.filename.indexOf(session.filename));
        session.referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
        session.host = new URL(session.referer).hostname;
        if (captureFilterWorker()) {
            browser.downloads.cancel(item.id).then(() => {
                browser.downloads.erase({id: item.id}, () => {
                    downWithAria2(session);
                });
            }, () => {
                showNotification(browser.i18n.getMessage('warn_firefox'), item.url);
            });
        }
    });

    function captureFilterWorker() {
        if (localStorage['ignored'].includes(session.host)) {
            return false;
        }
        if (localStorage['capture'] === '2') {
            return true;
        }
        if (localStorage['monitored'].includes(session.host)) {
            return true;
        }
        if (localStorage['fileExt'].includes(item.filename.slice(item.filename.lastIndexOf('.') + 1).toLowerCase())) {
            return true;
        }
        if (localStorage['fileSize'] > 0 && item.fileSize >= localStorage['fileSize']) {
            return true;
        }
        return false;
    }

    function getFileName(uri) {
        var index = uri.lastIndexOf('\\') === -1 ? uri.lastIndexOf('/') : uri.lastIndexOf('\\');
        return uri.slice(index + 1);
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
