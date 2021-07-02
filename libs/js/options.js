function feedEventHandler() {
    document.querySelectorAll('[feed]').forEach(feed => {
        var field = feed.getAttribute('feed');
        var root = feed.getAttribute('root');
        var tree = root ? aria2RPC[root] : aria2RPC;
        feed.addEventListener('click', (event) => {
            document.getElementById(field).value = tree[feed.id];
        });
    });
}

function parseValueToOption(field, options) {
    if (field.hasAttribute('calc')) {
        var calc = bytesToFileSize(options[field.id]);
        field.value = calc.slice(0, calc.indexOf(' ')) + calc.slice(calc.indexOf(' ') + 1, -1);
    }
    else {
        field.value = options[field.id] ?? '';
    }
}

function printGlobalOption() {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.getGlobalOption', params: [aria2RPC.jsonrpc['token']]},
    options => {
        document.querySelectorAll('[aria2]').forEach(aria2 => parseValueToOption(aria2, options));
    });
}

function printTaskOption(gid) {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.getOption', params: [aria2RPC.jsonrpc['token'], gid]},
    options => {
        document.querySelectorAll('[task]').forEach(task => parseValueToOption(task, options));
    });
}

function changeGlobalOption(name, value, options = {}) {
    options[name] = value;
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.changeGlobalOption', params: [aria2RPC.jsonrpc['token'], options]});
}

function changeTaskOption(gid, name, value, options = {}) {
    options[name] = value;
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.changeOption', params: [aria2RPC.jsonrpc['token'], gid, options]});
}
