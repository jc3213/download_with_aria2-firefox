var gid = location.hash.slice(1);
var type = location.search.slice(1);

function aria2RPCClient() {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.tellStatus', params: [aria2RPC.jsonrpc['token'], gid]},
    result => {
        var disabled = ['complete', 'error'].includes(result.status);
        document.querySelector('#name').innerText = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.slice(result.files[0].path.lastIndexOf('/') + 1) || result.files[0].uris[0].uri;
        document.querySelector('#name').className = result.status;
        document.querySelector('#local').innerText = bytesToFileSize(result.completedLength);
        document.querySelector('#ratio').innerText = ((result.completedLength / result.totalLength * 10000 | 0) / 100) + '%';
        document.querySelector('#remote').innerText = bytesToFileSize(result.totalLength);
        document.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
        document.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
        document.querySelector('[task="max-download-limit"]').disabled = disabled;
        document.querySelector('[task="max-upload-limit"]').disabled = disabled || type === 'http';
        document.querySelector('[task="all-proxy"]').disabled = disabled;
        if (type === 'bt') {
            result.files.forEach(file => printTaskFiles(file, document.querySelector('#files')));
        }
        if (type === 'http') {
            result.files[0].uris.forEach(uri => printTaskUris(uri, document.querySelector('#uris')));
        }
    });
}

function printTaskUris(uri, table) {
    var cells = table.querySelectorAll('div');
    var uris = [...cells].map(cell => cell.innerText);
    var index = uris.indexOf(uri.uri);
    var cell = index === -1 ? appendUriToTable(uri, table) : cells[index];
    cell.className = uri.status === 'used' ? 'active' : 'waiting';
}

function appendUriToTable(uri, table) {
    var cell = table.querySelector('#template').cloneNode(true);
    cell.removeAttribute('id');
    cell.innerText = uri.uri;
    table.appendChild(cell);
    return cell;
}

function printTaskFiles(file, table) {
    var cell = appendFileToTable(file, table);
    cell.querySelector('#index').className = file.selected === 'true' ? 'active' : 'error';
    cell.querySelector('#ratio').innerText = ((file.completedLength / file.length * 10000 | 0) / 100) + '%';
}

function appendFileToTable(file, table) {
    var id = file.index + file.length;
    var cell = document.getElementById(id) ?? table.querySelector('#template').cloneNode(true);
    cell.id = id;
    cell.querySelector('#index').innerText = file.index;
    cell.querySelector('#name').innerText = file.path.slice(file.path.lastIndexOf('/') + 1);
    cell.querySelector('#name').title = file.path;
    cell.querySelector('#size').innerText = bytesToFileSize(file.length);
    table.appendChild(cell);
    return cell;
}

document.querySelector('#name[button]').addEventListener('click', (event) => {
    frameElement.remove();
});

document.querySelectorAll('[http], [bt]').forEach(field => {
    field.style.display = field.hasAttribute(type) ? 'block' : 'none';
});

document.querySelector('[card].container').addEventListener('change', (event) => {
    var name = event.target.getAttribute('task');
    changeTaskOption(name, event.target.value);
});

document.querySelectorAll('[swap]').forEach(swap => {
    var name = swap.getAttribute('swap');
    var field = document.querySelector('[task="' + name + '"]');
    swap.addEventListener('click', (event) => {
        if (!field.disabled) {
            swap.style.display = 'none';
            field.parentNode.style.display = 'block';
            field.focus();
        }
    });
    field.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
            field.parentNode.style.display = 'none';
            swap.style.display = 'block';
        }
    });
});

document.querySelector('[feed]').addEventListener('click', (event) => {
    var name = event.target.getAttribute('local');
    var root = event.target.getAttribute('root');
    root ? {[root]: {[name] : value}} = aria2RPC : {[name] : value} = aria2RPC;
    var feed = event.target.getAttribute('feed');
    document.querySelector('[task="all-proxy"]').value = value;
    changeTaskOption(name, value);
});

document.querySelector('#uris').addEventListener('click', (event) => {
    if (event.ctrlKey) {
        changeTaskUri({remove: event.target.innerText});
    }
    else {
        navigator.clipboard.writeText(event.target.innerText);
    }
});

document.querySelector('#source > span').addEventListener('click', (event) => {
    changeTaskUri({add: document.querySelector('#source > input').value});
    document.querySelector('#source > input').value = '';
});

document.querySelector('#files').addEventListener('click', (event) => {
    if (event.target.className) {
        var checked = '';
        document.querySelectorAll('td:nth-child(1)').forEach(file => {
            if (file === event.target && file.className !== 'active' || file !== event.target && file.className === 'active') {
                checked += ',' + file.innerText;
            }
        });
        changeTaskOption('select-file', checked.slice(1));
    }
});

aria2RPCLoader(() => {
    aria2RPCClient();
    aria2RPCKeepAlive();
    aria2TaskOption();
});

function changeTaskUri({add, remove}) {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.changeUri', params: [aria2RPC.jsonrpc['token'], gid, 1, remove ? [remove] : [], add ? [add] : []]});
}

function aria2TaskOption() {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.getOption', params: [aria2RPC.jsonrpc['token'], gid]},
    options => {
        aria2Global = options;
        document.querySelectorAll('[task]').forEach(field => {
            var name = field.getAttribute('task');
            if (field.hasAttribute('calc')) {
                var calc = bytesToFileSize(options[name]);
                field.value = calc.slice(0, calc.indexOf(' ')) + calc.slice(calc.indexOf(' ') + 1, -1);
            }
            else {
                field.value = options[name] ?? '';
            }
        });
    });
}

function changeTaskOption(name, value) {
    aria2Global[name] = value;
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.changeOption', params: [aria2RPC.jsonrpc['token'], gid, aria2Global]});
}
