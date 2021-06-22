browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2firefox',
    contexts: ['link']
});

browser.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2({url: [info.linkUrl], referer: info.pageUrl, hostname: getHostnameFromUrl(info.pageUrl)});
    }
});

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
    var {session, options} = message;
    downWithAria2(session, options);
    response();
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

    var session = {url: [item.url], filename: getFileNameFromUri(item.filename)};
    var tabs = await browser.tabs.query({active: true, currentWindow: true});
    session.folder = item.filename.slice(0, item.filename.indexOf(session.filename));
    session.referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
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

browser.browserAction.setBadgeBackgroundColor({color: '#3cc'});

async function downWithAria2(session, options = {}) {
    if (!session.url) {
        return;
    }
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (localStorage['output'] === '1' && session.folder) {
        options['dir'] = session.folder;
    }
    else if (localStorage['output'] === '2' && localStorage['folder']) {
        options['dir'] = localStorage['folder'];
    }
    if (!options['all-proxy'] && localStorage['proxied'].includes(session.hostname)) {
        options['all-proxy'] = localStorage['allproxy'];
    }
    options['header'] = await getCookiesFromReferer(session.referer);
    jsonRPCRequest(
        {method: 'aria2.addUri', url: session.url, options},
        (result) => {
            showNotification(browser.i18n.getMessage('warn_download'), session.url.join('\n'));
        },
        (error, jsonrpc) => {
            showNotification(error, jsonrpc || session.url.join('\n'));
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

async function getCookiesFromReferer(url, result = 'Cookie:') {
    var header = ['User-Agent: ' + localStorage['useragent'], 'Connection: keep-alive'];
    if (url) {
        var cookies = await browser.cookies.getAll({url});
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

function displayActiveTaskNumber() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalStat'},
        (result) => {
            browser.browserAction.setBadgeText({text: result.numActive === '0' ? '' : result.numActive});
        }
    );
}

displayActiveTaskNumber();
var activeTaskNumber = setInterval(displayActiveTaskNumber, 1000);
