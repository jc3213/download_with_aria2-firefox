chrome.contextMenus.create({
    title: chrome.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link'],
    onclick: (info, tab) => {
        downWithAria2({url: info.linkUrl, referer: tab.url, host: new URL(tab.url).hostname});
    }
});

chrome.runtime.onInstalled.addListener((details) => {
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

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
    if (localStorage['capture'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
        return;
    }

    var session = {url: item.finalUrl, filename: item.filename};
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        session.referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
        session.host = new URL(session.referer).hostname;
        if (captureFilterWorker()) {
            chrome.downloads.cancel(item.id, () => {
                chrome.downloads.erase({id: item.id}, () => {
                    downWithAria2(session);
                });
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
});

function displayActiveTaskNumber() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalStat'},
        (result) => {
            chrome.browserAction.setBadgeText({text: result.numActive === '0' ? '' : result.numActive});
        }
    );
}

chrome.browserAction.setBadgeBackgroundColor({color: '#3CC'});
displayActiveTaskNumber();
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
