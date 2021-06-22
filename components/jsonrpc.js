async function jsonRPCRequest(request, success, failure) {
    var jsonrpc = localStorage['jsonrpc'];
    var requestJSON = Array.isArray(request) ? request.map(item => createJSON(item)) : [createJSON(request)];
    var response = await fetch(jsonrpc, {method: 'POST', body: JSON.stringify(requestJSON)});
    if (response.ok) {
        var responseJSON = await response.json();
        var result = responseJSON[0].result;
        var error = responseJSON[0].error;
        if (result && typeof success === 'function') {
            success(...responseJSON.map(item => item.result));
        }
        if (error && typeof failure === 'function') {
            failure(error.message);
        }
    }
    else {
        if (typeof failure === 'function') {
            failure('No Response', jsonrpc);
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
