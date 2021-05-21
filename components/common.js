function jsonRPCRequest(request, success, failure) {
    var rpc = localStorage['jsonrpc'];
    var json = Array.isArray(request) ? request.map(item => createJSON(item)) : [createJSON(request)];
    var xhr = new XMLHttpRequest();
    xhr.open('POST', rpc, true);
    xhr.onloadend = () => {
        if (xhr.status === 200) {
            var response = JSON.parse(xhr.response);
            var result = response[0].result;
            var error = response[0].error;
            if (result && typeof success === 'function') {
                success(...response.map(item => item.result));
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
    };
    xhr.send(JSON.stringify(json));

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
}

function downWithAria2(session, options = {}, bypass = false) {
    if (!session.url) {
        return;
    }
    var url = Array.isArray(session.url) ? session.url.map(url => encodeLoopRange(url)) : [encodeLoopRange(session.url)];
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
    if (!options['all-proxy'] && localStorage['proxied'].includes(session.host)) {
        options['all-proxy'] = localStorage['allproxy'];
    }
    options['header'] = ['User-Agent: ' + localStorage['useragent']];
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

    function encodeLoopRange(url) {
        return url.replace(/\[/g, '%5B').replace(/\]/g, '%5D');
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

function restoreSettings(textJSON, update = true) {
    var options = JSON.parse(textJSON);
    Object.keys(options).forEach(key => {
        if (localStorage[key] && update) {
            return;
        }
        localStorage[key] = options[key];
    });
};

function bytesToFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    }
    else if (bytes >= 1024 && bytes < 1048576) {
        return (bytes / 10.24 | 0) / 100 + ' KB';
    }
    else if (bytes >= 1048576 && bytes < 1073741824) {
        return (bytes / 10485.76 | 0) / 100 + ' MB';
    }
    else if (bytes >= 1073741824 && bytes < 1099511627776) {
        return (bytes / 10737418.24 | 0) / 100 + ' GB';
    }
    else if (bytes >= 1099511627776) {
        return (bytes / 10995116277.76 | 0) / 100 + ' TB';
    }
}

function numberToTimeFormat(number) {
    if (isNaN(number) || number === Infinity) {
        return '∞';
    }
    var days = number / 86400 | 0;
    var hours = number / 3600 - days * 24 | 0;
    var minutes = number / 60 - days * 1440 - hours * 60 | 0;
    var seconds = number - days * 86400 - hours * 3600 - minutes * 60 | 0;
    return (days > 0 ? days + '<sub>d</sub>' : '')
    +      (hours > 0 ? hours + '<sub>h</sub>' : '')
    +      (minutes > 0 ? minutes + '<sub>m</sub>' : '')
    +      seconds + '<sub>s</sub>';
}
