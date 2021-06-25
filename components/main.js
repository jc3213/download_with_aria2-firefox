var aria2RPC = {
    register: () => {
        aria2RPC.keepAlive = setInterval(() => {
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
            browser.runtime.sendMessage(aria2RPC);
        }, 1000);
    },
    unregister: () => {
        clearInterval(aria2RPC.keepAlive);
    }
};

browser.contextMenus.create({
    title: browser.i18n.getMessage('extension_name'),
    id: 'downwitharia2',
    contexts: ['link']
});

browser.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === 'downwitharia2') {
        downWithAria2({url: info.linkUrl, referer: info.pageUrl, hostname: getHostnameFromUrl(info.pageUrl)});
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

browser.downloads.onDeterminingFilename.addListener(async (item, suggest) => {
    if (localStorage['capture'] === '0' || item.finalUrl.startsWith('blob') || item.finalUrl.startsWith('data')) {
        return;
    }

    var session = {url: item.finalUrl, filename: item.filename};
    var tabs = await getCurrentActiveTabs();
    session.referer = item.referrer && item.referrer !== 'about:blank' ? item.referrer : tabs[0].url;
    session.hostname = getHostnameFromUrl(session.referer);
    if (captureFilterWorker(session.hostname, getFileExtension(session.filename), item.fileSize)) {
        browser.downloads.cancel(item.id, () => {
            browser.downloads.erase({id: item.id}, () => {
                downWithAria2(session);
            });
        });
    }
});

//Wrapper untill manifest v3
async function getCurrentActiveTabs() {
    return new Promise((resolve, reject) => {
        browser.tabs.query({active: true, currentWindow: true}, (tabs) => {
            resolve(tabs);
        })
    });
}

async function downWithAria2(session, options = {}) {
    var url = Array.isArray(session.url) ? session.url : [session.url];
    if (session.filename) {
        options['out'] = session.filename;
    }
    if (!options['all-proxy'] && localStorage['proxied'].includes(session.hostname)) {
        options['all-proxy'] = localStorage['allproxy'];
    }
    options['header'] = await getCookiesFromReferer(session.referer);
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

async function getCookiesFromReferer(url, result = 'Cookie:') {
    var header = ['User-Agent: ' + localStorage['useragent'], 'Connection: keep-alive'];
    //Wrapper untill manifest v3
    return new Promise((resolve, reject) => {
        if (url) {
            browser.cookies.getAll({url}, (cookies) => {
                cookies.forEach(cookie => {
                    result += ' ' + cookie.name + '=' + cookie.value + ';';
                });
                header.push(result, 'Referer: ' + url);
                resolve(header);
            });
        }
        else {
            resolve(header);
        }
    });
}

function getHostnameFromUrl(url) {
    var host = url.split('/')[2];
    if (host.includes(':')) {
    	return host.slice(0, host.indexOf(':'))
 	}
    return host;
}

function getFileExtension(filename) {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}

aria2RPC.register();
