function jsonRPCRequest(request, success, failure) {
    success = success || function() {};
    failure = failure || function() {};
    var rpc = localStorage.getItem('jsonrpc') || 'http://localhost:6800/jsonrpc';
    var xhr = new XMLHttpRequest();
    if (request.length) {
        var json = request.map(item => createJSON(item));
    }
    else {
        json = createJSON(request);
    }
    xhr.open('POST', rpc, true);
    xhr.onload = (event) => {
        var response = JSON.parse(xhr.response);
        if (json.length) {
            var error = multiRequest(response);
        }
        else {
            error = singleRequest(response);
        }
        if (error) {
            if (error === 'Unauthorized') {
                failure(error, rpc);
            }
            else {
                failure(error);
            }
        }
    };
    xhr.onerror = () => {
        failure('No response', rpc);
    };
    xhr.send(JSON.stringify(json));

    function createJSON(request) {
        var token = localStorage.getItem('token') || '';
        var json = {
            'jsonrpc': 2.0,
            'method': request.method,
            'id': '',
            'params': [
                'token:' + token
            ]
        };
        if (request.gid) {
            json.params.push(request.gid);
        }
        if (request.index) {
            json.params = [...json.params, ...request.index];
        }
        if (request.url) {
            var url = santilizeLoop(request.url);
            json.params.push([url]);
        }
        if (request.options) {
            json.params.push(request.options);
        }
        return json;
    }

    function santilizeLoop(url) {
        var loop = url.match(/\[[^\]]+\]/g);
        if (loop) {
            loop.map(item => {
                if (!item.match(/\[\d+-\d+\]/)) {
                    var frag = item.replace('[', '%5B').replace(']', '%5D');
                    url = url.replace(item, frag);
                }
            });
        }
        return url;
    }

    function multiRequest(response) {
        var result = response.map(item => item = item.result);
        if (result[0]) {
            return success(...result);
        }
        var error = response.map(item => item = item.error);
        if (error[0]) {
            return error[0].message;
        }
    }

    function singleRequest(response) {
        if (response.result) {
            return success(response.result);
        }
        if (response.error) {
            return response.error.message;
        }
    }
}

function showNotification(title, message) {
    var id = 'aria2_' + Date.now();
    var notification = {
        'type': 'basic',
        'title': title,
        'iconUrl': 'icons/icon64.png',
        'message': message || ''
    };
    browser.notifications.create(id, notification, () => {
        setTimeout(() => {
            browser.notifications.clear(id);
        }, 5000);
    });
}

function downWithAria2(url, dir, referer, proxy) {
    var domain = domainFromUrl(url);
    var proxied = localStorage.getItem('proxied') || '';
    if (proxied.includes(domain)) {
        proxy = proxy || localStorage.getItem('allproxy') || '';
    }
    var options = {
        'header': [
            'User-Agent: ' + localStorage.getItem('useragent') || navigator.userAgent
        ],
        'all-proxy': proxy
    }
    if (dir) {
        options['dir'] = dir;
    }
    if (referer) {
        browser.cookies.getAll({'url': referer}, (cookies) => {
            options.header.push('Referer: ' + referer);
            options.header.push('Cookie: ' + cookies.map(item => item.name + '=' + item.value + ';').join(' '));
            sendRequest(options);
        });
    }
    else {
        sendRequest(options);
    }

    function sendRequest(options) {
        jsonRPCRequest(
            {'method': 'aria2.addUri', 'url': url, 'options': options},
            (result) => {
                showNotification('Downloading', url);
            },
            (error, rpc) => {
                showNotification(error, rpc || url || 'No URI to download');
            }
        );
    }

    return url;
}

function domainFromUrl(url) {
    var host = url.split(/[\/:]+/)[1];
    var temp = host.split('.').reverse();
    if ('com,net,org,edu,gov,co'.includes(temp[1])) {
        return temp[2] + '.' + temp[1] + '.' + temp[0];
    }
    return temp[1] + '.' + temp[0];
}

function bytesToFileSize(bytes) {
    var KBytes = 1024;
    var MBytes = 1048576;
    var GBytes = 1073741824;
    var TBytes = 1099511627776;
    if (bytes >= 0 && bytes < KBytes) {
        return bytes + ' B';
    }
    else if (bytes >= KBytes && bytes < MBytes) {
        return (bytes / KBytes * 100 + 1 | 0) / 100 + ' KB';
    }
    else if (bytes >= MBytes && bytes < GBytes) {
        return (bytes / MBytes * 100 + 1 | 0) / 100 + ' MB';
    }
    else if (bytes >= GBytes && bytes < TBytes) {
        return (bytes / GBytes * 100 + 1 | 0) / 100 + ' GB';
    }
    else if (bytes >= TBytes) {
        return (bytes / TBytes * 100 + 1 | 0) / 100 + ' TB';
    }
    else {
        return bytes + ' B';
    }
}

function multiDecimalNumber(number, decimal) {
    decimal = decimal || 2;
    if (number.toString().length >= decimal ) {
        return number.toString();
    }
    var result = (number | 0) + Math.pow(10, decimal);
    return result.toString().substr(1);
}

function secondsToHHMMSS(number) {
    if (isNaN(number) || number === Infinity) {
        return '∞';
    }
    var hours = (number / 3600 | 0);
    var minutes = ((number - hours * 3600) / 60 | 0);
    var seconds = (number - hours * 3600 - minutes * 60 | 0);
    var time = hours + 'h' + minutes + 'm' + seconds + 's';
    return time.replace(/(0[hm])*/, '');
}
