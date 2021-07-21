browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2firefox',
    contexts: ['link']
});

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downwitharia2firefox') {
        downloadWithAria2({url: info.linkUrl, referer: info.pageUrl, storeId: tab.cookieStoreId, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

browser.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        fetch('options.json').then(response => response.json()).then(json => chrome.storage.local.set(json));
    }
});

browser.browserAction.setBadgeBackgroundColor({color: '#3cc'});

browser.downloads.onCreated.addListener(async item => {
    if (aria2RPC.capture['mode'] === '0' || item.url.startsWith('blob') || item.url.startsWith('data')) {
        return;
    }

    var tabs = await browser.tabs.query({active: true, currentWindow: true});
    var url = item.url;
    var referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
    var hostname = getHostnameFromUrl(referer);
    var filename = getFileNameFromUri(item.filename);
    var folder = item.filename.slice(0, item.filename.indexOf(filename));
    var storeId = tabs[0].cookieStoreId;

    if (await captureDownload(hostname, getFileExtension(filename), url)) {
        browser.downloads.cancel(item.id).then(() => {
            browser.downloads.erase({id: item.id}).then(() => {
                downloadWithAria2({url, referer, hostname, filename, folder, storeId});
            });
        }).catch(error => showNotification('Download is already complete'));
    }
});

aria2RPCLoader(() => {
    aria2RPCClient();
    aria2RPCKeepAlive();
});

async function captureDownload(hostname, fileExt, url) {
    if (aria2RPC.capture['reject'].includes(hostname)) {
        return false;
    }
    if (aria2RPC.capture['mode'] === '2') {
        return true;
    }
    if (aria2RPC.capture['resolve'].includes(hostname)) {
        return true;
    }
    if (aria2RPC.capture['fileExt'].includes(fileExt)) {
        return true;
    }
// Use asynchrounous Fetch API to resolve fileSize till Mozilla fixes downloadItem.fileSize
    var fileSize = await fetch(url, {method: 'HEAD'}).then(response => response.headers.get('content-length'));
// See https://bugzilla.mozilla.org/show_bug.cgi?id=1666137 for more details
    if (aria2RPC.capture['fileSize'] > 0 && fileSize >= aria2RPC.capture['fileSize']) {
        return true;
    }
    return false;
}

function getHostnameFromUrl(url) {
    var host = url.split('/')[2];
    var index = host.indexOf(':');
    return host.slice(0, index === -1 ? host.length : index);
}

function getFileNameFromUri(uri) {
    var index = uri.lastIndexOf('\\') === -1 ? uri.lastIndexOf('/') : uri.lastIndexOf('\\');
    return uri.slice(index + 1);
}

function getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}

function aria2RPCClient() {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.getGlobalStat', params: [aria2RPC.jsonrpc['token']]},
    global => {
        browser.browserAction.setBadgeText({text: global.numActive === '0' ? '' : global.numActive});
    },
    error => {
        showNotification(error);
        clearInterval(keepAlive);
    });
}
