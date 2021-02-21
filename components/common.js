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
        var json = {
            jsonrpc: 2.0,
            method: request.method,
            id: '',
            params: ['token:' + localStorage['token']]
        };
        if (request.gid) {
            json.params.push(request.gid);
        }
        if (request.index) {
            json.params.push(...request.index);
        }
        if (request.url) {
            json.params.push([santilizeLoop(request.url)]);
        }
        if (request.options) {
            json.params.push(request.options);
        }
        return json;
    }

    function santilizeLoop(url) {
        var loop = url.match(/\[[^\[\]]+\]/g);
        var log = [];
        if (loop) {
            loop.forEach(item => {
                if (item.match(/\[\d+-\d+\]/)) {
                    log.push(item);
                }
                else {
                    url = url.replace(item, encodeURI(item));
                }
            });
            if (JSON.stringify(loop) !== JSON.stringify(log)) {
                return santilizeLoop(url);
            }
        }
        return url;
    }
}

function downWithAria2(session, options = {}, bypass = false) {
    if (!session.url) {
        return;
    }
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
    options['header'].push('Referer: ' + session.referer);
    var cookie = 'Cookie:';
    browser.cookies.getAll({url: session.referer}, (cookies) => {
        cookies.forEach(item => cookie += ' ' + item.name + '=' + item.value + ';');
        options['header'].push(cookie);
        sendRPCRequest();
    });

    function sendRPCRequest() {
        jsonRPCRequest(
            {method: 'aria2.addUri', url: session.url, options},
            (result) => {
                showNotification('Downloading', session.url);
            },
            (error, rpc) => {
                showNotification(error, rpc || session.url);
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
        setTimeout(() => browser.notifications.clear(id), 5000);
    });
}

function restoreSettings(json, update = true) {
    var options = JSON.parse(json);
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

function numberToTimeFormat(number, time = '') {
    if (isNaN(number) || number === Infinity) {
        return '∞';
    }
    if (number > 86400) {
        var days = number / 86400 | 0;
        time += days + '<sub>d</sub>';
        number -= days * 86400;
    }
    if (number > 3600) {
        var hours = number / 3600 | 0;
        time += hours + '<sub>h</sub>'
        number -= hours * 3600;
    }
    if (number > 60) {
        var minutes = number / 60 | 0;
        time += minutes + '<sub>m</sub>';
        number -= minutes * 60;
    }
    return time + (number | 0) + '<sub>s</sub>';
}
