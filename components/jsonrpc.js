function jsonRPCRequest(request, success, failure) {
    var jsonrpc = aria2RPC.option.jsonrpc['uri'];
    var requestJSON = Array.isArray(request) ? request.map(item => createJSON(item)) : [createJSON(request)];
    fetch(jsonrpc, {method: 'POST', body: JSON.stringify(requestJSON)}).then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw(response.statusText);
        }
    }).then(responseJSON => {
        var result = responseJSON[0].result;
        var error = responseJSON[0].error;
        if (result && typeof success === 'function') {
            success(...responseJSON.map(item => item.result));
        }
        if (error) {
            throw(error.message);
        }
    }).catch(error => {
        if (typeof failure === 'function') {
            failure(error);
        }
    });
}

function createJSON(request) {
    var params = ['token:' + aria2RPC.option.jsonrpc['token']];
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

function showNotification(title = 'Aria2 Response', message = '') {
    var id = browser.notifications.create({
        type: 'basic',
        title: title,
        iconUrl: '/icons/icon48.png',
        message: message
    });
    setTimeout(() => {
        browser.notifications.clear(id);
    }, 5000);
}
