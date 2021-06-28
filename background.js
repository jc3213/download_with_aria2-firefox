var aria2RPC = {};

function aria2RPCRequest(request) {
    var jsonrpc = aria2RPC.option.jsonrpc['uri'];
    var requestJSON = Array.isArray(request) ? request : [request];
    return fetch(jsonrpc, {method: 'POST', body: JSON.stringify(requestJSON)}).then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw(response.statusText);
        }
    }).then(responseJSON => {
        var result = responseJSON[0].result;
        var error = responseJSON[0].error;
        if (result) {
            return responseJSON.map(item => item.result);
        }
        if (error) {
            throw(error.message);
        }
    });
}

function registerMessageService() {
    clearInterval(aria2RPC.keepAlive);
    clearInterval(aria2RPC.message);
    aria2RPC.keepAlive = setInterval(() => {
        aria2RPCRequest([
            {id: '', jsonrpc: 2, method: 'aria2.getVersion', params: [aria2RPC.option.jsonrpc['token']]},
            {id: '', jsonrpc: 2, method: 'aria2.getGlobalOption', params: [aria2RPC.option.jsonrpc['token']]},
            {id: '', jsonrpc: 2, method: 'aria2.getGlobalStat', params: [aria2RPC.option.jsonrpc['token']]},
            {id: '', jsonrpc: 2, method: 'aria2.tellActive', params: [aria2RPC.option.jsonrpc['token']]},
            {id: '', jsonrpc: 2, method: 'aria2.tellWaiting', params: [aria2RPC.option.jsonrpc['token'], 0, 999]},
            {id: '', jsonrpc: 2, method: 'aria2.tellStopped', params: [aria2RPC.option.jsonrpc['token'], 0, 999]},
            {id: '', jsonrpc: 2, method: 'aria2.tellStatus', params: [aria2RPC.option.jsonrpc['token'], aria2RPC.lastSession]},
            {id: '', jsonrpc: 2, method: 'aria2.getOption', params: [aria2RPC.option.jsonrpc['token'], aria2RPC.lastSession]}
        ]).then(response => {
            var [version, globalOption, globalStat, active, waiting, stopped, result, option] = response;
            aria2RPC = {...aria2RPC, version, globalOption, globalStat, active, waiting, stopped, error: '', lastSessionResult: {result, option}};
            browser.browserAction.setBadgeText({text: globalStat.numActive === '0' ? '' : globalStat.numActive});
        }).catch(error => {
            aria2RPC = {...aria2RPC, error};
            showNotification(error);
            clearInterval(aria2RPC.keepAlive);
        });
    }, 1000);
    aria2RPC.message = setInterval(() => {
        browser.runtime.sendMessage(aria2RPC);
    }, aria2RPC.option.jsonrpc['refresh']);
}

browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2firefox',
    contexts: ['link']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2firefox') {
        startDownload({url: info.linkUrl, referer: info.pageUrl, storeId: tab.cookieStoreId, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

browser.storage.local.get(null, result => {
    aria2RPC.option = result;
    registerMessageService();
});

browser.storage.onChanged.addListener(changes => {
    Object.keys(changes).forEach(key => {
        aria2RPC.option[key] = changes[key].newValue;
        if (key === 'jsonrpc') {
            registerMessageService();
        }
    });
});

browser.browserAction.setBadgeBackgroundColor({color: '#3cc'});

browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        var response = await fetch('option.json');
        var json = await response.json();
        browser.storage.local.set(json);
    }
    if (details.reason === 'update' && details.previousVersion <= '2.6800') {
        browser.storage.local.set({
            jsonrpc: {
                uri: localStorage['jsonrpc'] ?? 'http://localhost:6800/jsonrpc',
                token: 'token:' + (localStorage['token'] ?? ''),
                refresh: localStorage['refresh'] | 0
            },
            folder: {
                mode: localStorage['output'] ?? '0',
                uri: localStorage['folder'] ?? ''
            },
            useragent: localStorage['useragent'] ?? navigator.userAgent,
            proxy: {
                uri: localStorage['allproxy'] ?? '',
                resolve: (localStorage['proxied'] ?? '').split(/[\s\n,]/)
            },
            capture: {
                mode: localStorage['capture'] ?? '0',
                reject: (localStorage['ignored'] ?? '').split(/[\s\n,]/),
                resolve: (localStorage['monitored'] ?? '').split(/[\s\n,]/),
                fileExt: (localStorage['fileExt'] ?? '').split(/[\s\n,]/),
                fileSize: localStorage['fileSize'] | 0
            }
        });
        localStorage.clear();
    }
    else if (details.reason === 'update' && details.previousVersion <= '2.7010') {
        browser.storage.local.clear();
        fetch('option.json').then(response => response.json()).then(json => browser.storage.local.set(json));
    }
});

browser.runtime.onMessage.addListener((message, sender, response) => {
    var {jsonrpc, download, request, restart, session, purge} = message;
    if (jsonrpc) {
        response(aria2RPC);
    }
    if (download) {
        startDownload(...download);
    }
    if (request) {
        aria2RPCRequest(request);
        response();
    }
    if (restart) {
        aria2RPCRequest(restart).then(restartDownload);
        response();
    }
    if (session !== undefined) {
        aria2RPC.lastSession = session;
    }
    if (purge) {
        aria2RPC.stopped = [];
    }
});

// Temporary till downloadItem.fileSize is fixed, see https://bugzilla.mozilla.org/show_bug.cgi?id=1666137
var webRequest = [];
browser.webRequest.onHeadersReceived.addListener((event) => {
    var length = event.responseHeaders.find(item => item.name === 'content-length');
    if (length) {
        webRequest.push({url: event.url, fileSize: length.value});
    }
    if (webRequest.length > 50) {
        webRequest.shift();
    }
}, {'urls': ['<all_urls>']}, ['blocking', 'responseHeaders']);

function fileSizeWrapper(url) {
    var request = webRequest.find(request => request.url === url);
    if (request) {
        return request.fileSize;
    }
    return -1;
}
// End of downloadItem.fileSize wrapper

browser.downloads.onCreated.addListener(async (item) => {
    if (aria2RPC.option.capture['mode'] === '0' || item.url.startsWith('blob') || item.url.startsWith('data')) {
        return;
    }

    var tabs = await browser.tabs.query({active: true, currentWindow: true});
    var url = item.url;
    var referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
    var hostname = getHostnameFromUrl(referer);
    var filename = getFileNameFromUri(item.filename);
    var folder = filename.slice(0, item.filename.indexOf(filename));
    var storeId = tabs[0].cookieStoreId;

    if (captureFilterWorker(hostname, getFileExtension(filename), fileSizeWrapper(url))) {
        browser.downloads.cancel(item.id).then(() => {
            browser.downloads.erase({id: item.id}, () => {
                startDownload({url, referer, hostname, filename, folder, storeId});
            });
        }, showNotification);
    }
});

async function startDownload(session, option = {}) {
    var url = Array.isArray(session.url) ? session.url : [session.url];
    if (session.filename) {
        option['out'] = session.filename;
    }
    if (!option['all-proxy'] && aria2RPC.option.proxy['resolve'].includes(session.hostname)) {
        option['all-proxy'] = aria2RPC.option.proxy['uri'];
    }
    option['header'] = await getCookiesFromReferer(session.referer, session.storeId);
    if (aria2RPC.option.folder['mode'] === '1' && session.folder) {
        option['dir'] = session.folder;
    }
    else if (aria2RPC.option.folder['mode'] === '2' && aria2RPC.option.folder['uri']) {
        option['dir'] = aria2RPC.option.folder['uri'];
    }
    downloadWithAria2(url, option);
}

function restartDownload() {
    var {result, option} = aria2RPC.lastSessionResult;
    var url = result.files[0].uris.map(uri => uri.uri);
    downloadWithAria2(url, option);
};

function downloadWithAria2(url, option) {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.addUri', params: [aria2RPC.option.jsonrpc['token'], url, option]})
        .then(response => showNotification(url.join('\n')))
        .catch(showNotification);
}

function captureFilterWorker(hostname, fileExt, fileSize) {
    if (aria2RPC.option.capture['reject'].includes(hostname)) {
        return false;
    }
    if (aria2RPC.option.capture['mode'] === '2') {
        return true;
    }
    if (aria2RPC.option.capure['resolve'].includes(hostname)) {
        return true;
    }
    if (aria2RPC.option.capture['fileExt'].includes(fileExt)) {
        return true;
    }
    if (aria2RPC.option.capture['fileSize'] > 0 && fileSize >= aria2RPC.option.capture['fileSize']) {
        return true;
    }
    return false;
}

async function getCookiesFromReferer(url, storeId = 'firefox-default', result = 'Cookie:') {
    var header = ['User-Agent: ' + aria2RPC.option['useragent'], 'Connection: keep-alive'];
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

function showNotification(message = '') {
    browser.notifications.create({
        type: 'basic',
        title: aria2RPC.option.jsonrpc['uri'],
        iconUrl: '/icons/icon48.png',
        message: message
    }, id => {
        setTimeout(() => {
            browser.notifications.clear(id);
        }, 5000);
    });
}
