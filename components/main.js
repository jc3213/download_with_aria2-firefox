var aria2RPC = {
    keepAlive: setInterval(() => {
        jsonRPCRequest([
            {method: 'aria2.getVersion'},
            {method: 'aria2.getGlobalOption'},
            {method: 'aria2.getGlobalStat'},
            {method: 'aria2.tellActive'},
            {method: 'aria2.tellWaiting', index: [0, 999]},
            {method: 'aria2.tellStopped', index: [0, 999]}
        ], (version, globalOption, globalStat, active, waiting, stopped) => {
            aria2RPC = {...aria2RPC, version, globalOption, globalStat, active, waiting, stopped, error: undefined};
            browser.browserAction.setBadgeText({text: globalStat.numActive === '0' ? '' : globalStat.numActive});
        }, (error) => {
            aria2RPC = {...aria2RPC, error};
        });
    }, 1000)
};

function registerMessageChannel() {
    clearInterval(aria2RPC.message);
    aria2RPC.message = setInterval(() => {
        browser.runtime.sendMessage(aria2RPC);
    }, 2000);
}

browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2firefox',
    contexts: ['link']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2firefox') {
        downWithAria2({url: info.linkUrl, referer: info.pageUrl, storeId: tab.cookieStoreId, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

browser.browserAction.setBadgeBackgroundColor({color: '#3cc'});

browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        var response = await fetch('/components/options.json');
        var json = await response.json();
        Object.keys(json).forEach(key => {
            localStorage[key] = json[key];
        });
    }
});

browser.runtime.onMessage.addListener((message, sender, response) => {
    var {jsonrpc, purge, session, options} = message;
    if (jsonrpc) {
        response(aria2RPC);
    }
    if (purge) {
        aria2RPC.stopped = [];
    }
    if (session && options) {
        downWithAria2(session, options);
    }
});

// Temporary wrapper until downloadItem.fileSize is fixed, see https://bugzilla.mozilla.org/show_bug.cgi?id=1666137
var requests = [];
browser.webRequest.onHeadersReceived.addListener(
    (event) => {
        try {
            var size = event.responseHeaders.find(item => item.name === 'content-length').value;
            requests.push({'url': event.url, 'size': size});
        }
        catch(error) {
            return;
        }
        finally {
            if (requests.length > 50) {
                requests.shift();
            }
        }
    },
    {'urls': ['<all_urls>']},
    ['blocking', 'responseHeaders']
)

function fileSizeWrapper(item) {
    return requests.find(request => request.url === item.url).size;
}
// End of file size wrapper

browser.downloads.onCreated.addListener(async (item) => {
    if (localStorage['capture'] === '0' || item.url.startsWith('blob') || item.url.startsWith('data')) {
        return;
    }

    var session = {url: item.url, filename: getFileNameFromUri(item.filename)};
    var tabs = await browser.tabs.query({active: true, currentWindow: true});
    session.folder = item.filename.slice(0, item.filename.indexOf(session.filename));
    session.referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
    session.storeId = tabs[0].cookieStoreId;
    session.hostname = getHostnameFromUrl(session.referer);
    if (captureFilterWorker(session.hostname, getFileExtension(session.filename), fileSizeWrapper(item))) {
        browser.downloads.cancel(item.id).then(() => {
            browser.downloads.erase({id: item.id}, () => {
                downWithAria2(session);
            });
        }, () => {
            showNotification(browser.i18n.getMessage('warn_firefox'), item.url);
        });
    }
});

async function downWithAria2(session, options = {}) {
    var url = Array.isArray(session.url) ? session.url : [session.url];
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (!options['all-proxy'] && localStorage['proxied'].includes(session.hostname)) {
        options['all-proxy'] = localStorage['allproxy'];
    }
    options['header'] = await getCookiesFromReferer(session.referer, session.storeId);
    if (localStorage['output'] === '1' && session.folder) {
        options['dir'] = session.folder;
    }
    else if (localStorage['output'] === '2' && localStorage['folder']) {
        options['dir'] = localStorage['folder'];
    }
    jsonRPCRequest(
        {method: 'aria2.addUri', url, options},
        (result) => {
            showNotification(browser.i18n.getMessage('warn_download'), url.join('\n'));
        },
        (error, jsonrpc) => {
            showNotification(error, jsonrpc || url.join('\n'));
        }
    );
}

function captureFilterWorker(hostname, fileExt, fileSize) {
    if (localStorage['ignored'].includes(hostname)) {
        return false;
    }
    if (localStorage['capture'] === '2') {
        return true;
    }
    if (localStorage['monitored'].includes(hostname)) {
        return true;
    }
    if (localStorage['fileExt'].includes(fileExt)) {
        return true;
    }
    if (localStorage['fileSize'] > 0 && fileSize >= localStorage['fileSize']) {
        return true;
    }
    return false;
}

async function getCookiesFromReferer(url, storeId = 'firefox-default', result = 'Cookie:') {
    var header = ['User-Agent: ' + localStorage['useragent'], 'Connection: keep-alive'];
    if (url) {
        var cookies = await browser.cookies.getAll({url, storeId});
        cookies.forEach(cookie => {
            result += ' ' + cookie.name + '=' + cookie.value + ';';
        });
        header.push(result, 'Referer: ' + url);
    }
    return header;
}

function getHostnameFromUrl(url) {
    var host = url.split('/')[2];
    if (host.includes(':')) {
    	return host.slice(0, host.indexOf(':'))
 	}
    return host;
}

function getFileNameFromUri(uri) {
    var index = uri.lastIndexOf('\\') === -1 ? uri.lastIndexOf('/') : uri.lastIndexOf('\\');
    return uri.slice(index + 1);
}

function getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}

registerMessageChannel();
