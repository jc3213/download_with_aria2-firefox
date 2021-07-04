var keepAlive;
var aria2RPCClient;

function aria2RPCKeepAlive() {
    if (aria2RPCClient) {
        clearInterval(keepAlive);
        keepAlive = setInterval(aria2RPCClient, aria2RPC.jsonrpc['refresh']);
    }
}

function aria2RPCLoader(callback) {
    browser.storage.local.get(null, result => {
        aria2RPC = result;
        callback();
    });
}

browser.storage.onChanged.addListener(changes => {
    Object.keys(changes).forEach(key => {
        aria2RPC[key] = changes[key].newValue;
        if (key === 'jsonrpc') {
            aria2RPCKeepAlive();
        }
    });
});

function aria2RPCRequest(request, resolve, reject) {
    var requestJSON = Array.isArray(request) ? request : [request];
    fetch(aria2RPC.jsonrpc['uri'], {method: 'POST', body: JSON.stringify(requestJSON)}).then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw(response.statusText);
        }
    }).then(responseJSON => {
        var {result, error} = responseJSON[0];
        if (result && typeof resolve === 'function') {
            resolve(...responseJSON.map(item => item.result));
        }
        if (error) {
            throw(error.message);
        }
    }).catch(error => {
        if (typeof reject === 'function') {
            reject(error);
        }
    });
}

async function downloadWithAria2({url, referer, hostname, filename}, options = {}) {
    var url = Array.isArray(url) ? url : [url];
    if (filename) {
        options['out'] = filename;
    }
    if (!options['all-proxy'] && aria2RPC.proxy['resolve'].includes(hostname)) {
        options['all-proxy'] = aria2RPC.proxy['uri'];
    }
    options['header'] = await getCookiesFromReferer(referer);
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.addUri', params: [aria2RPC.jsonrpc['token'], url, options]},
    result => showNotification(url[0]), showNotification);
}

async function getCookiesFromReferer(url, storeId = 'firefox-default', result = 'Cookie:') {
    var header = ['User-Agent: ' + aria2RPC['useragent'], 'Connection: keep-alive'];
    if (url) {
        var cookies = await browser.cookies.getAll({url, storeId});
        cookies.forEach(cookie => {
            result += ' ' + cookie.name + '=' + cookie.value + ';';
        });
        header.push(result, 'Referer: ' + url);
    }
    return header;
}

function showNotification(message = '') {
    browser.notifications.create({
        type: 'basic',
        title: aria2RPC.jsonrpc['uri'],
        iconUrl: '/icons/icon48.png',
        message: message
    }, id => {
        setTimeout(() => {
            browser.notifications.clear(id);
        }, 5000);
    });
}
