async function jsonRPCRequest(request, success, failure) {
    var rpc = localStorage['jsonrpc'];
    var json = Array.isArray(request) ? request.map(item => createJSON(item)) : [createJSON(request)];
    var response = await fetch(rpc, {method: 'POST', body: JSON.stringify(json)});
    if (response.ok) {
        var json = await response.json();
        var result = json[0].result;
        var error = json[0].error;
        if (result && typeof success === 'function') {
            success(...json.map(item => item.result));
        }
        if (error && typeof failure === 'function') {
            failure(error.message);
        }
    }
    else {
        if (typeof failure === 'function') {
            failure('No Response', rpc);
        }
    }
}

function createJSON(request) {
    var params = ['token:' + localStorage['token']];
    if (request.gid) {
        params.push(request.gid);
    }
    if (request.index) {
        params.push(...request.index);
    }
    if (request.url) {
        params.push(request.url);
    }
    if (request.add) {
        params.shift();
        params.push(1, [], [request.add]);
    }
    if (request.remove) {
        params.shift();
        params.push(1, [request.remove], []);
    }
    if (request.options) {
        params.push(request.options);
    }
    return {jsonrpc: 2.0, method: request.method, id: '', params};
}

function downWithAria2(session, options = {}, bypass = false) {
    if (!session.url) {
        return;
    }
    var url = Array.isArray(session.url) ? session.url : [session.url];
    if (bypass) {
        return sendRPCRequest();
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
    options['header'] = ['User-Agent: ' + localStorage['useragent'], 'Connection: keep-alive'];
    if (!session.referer) {
        return sendRPCRequest();
    }
    browser.cookies.getAll({url: session.referer}, (cookies) => {
        var cookie = 'Cookie:';
        cookies.forEach(item => cookie += ' ' + item.name + '=' + item.value + ';');
        options['header'].push(cookie, 'Referer: ' + session.referer);
        sendRPCRequest();
    });

    function sendRPCRequest() {
        jsonRPCRequest(
            {method: 'aria2.addUri', url, options},
            (result) => {
                showNotification(browser.i18n.getMessage('warn_download'), url.join('\n'));
            },
            (error, rpc) => {
                showNotification(error, rpc || url.join('\n'));
            }
        );
    }
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        type: 'basic',
        title: title || 'Aria2 Response',
        iconUrl: '/icons/icon48.png',
        message: message || ''
    };
    browser.notifications.create(id, notification, () => {
        setTimeout(() => {
            browser.notifications.clear(id);
        }, 5000);
    });
}
