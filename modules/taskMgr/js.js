var gid = location.search.slice(1);
var options = {};
var logic = 0;

browser.runtime.sendMessage({jsonrpc: true}, response => {
    printTaskManager(response);
    printTaskOption(gid);
    feedEventHandler();
});
browser.runtime.onMessage.addListener(printTaskManager);

function printTaskManager(response) {
    aria2RPC = response;
    var result = [...aria2RPC.active, ...aria2RPC.waiting, ...aria2RPC.stopped].find(task => task.gid === gid);
    var stopped = ['complete', 'error', 'removed'].includes(result.status);
    if (result.bittorrent) {
        printTaskDetails('bt');
        result.files.forEach(file => printTaskFiles(file, document.querySelector('#bt')));
    }
    else {
        printTaskDetails('http');
        result.files[0].uris.forEach(uri => printTaskUris(uri, document.querySelector('#http')));
    }
    document.querySelector('#name').innerText = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path ? result.files[0].path.slice(result.files[0].path.lastIndexOf('/') + 1) : result.files[0].uris[0].uri;
    document.querySelector('#name').className = result.status;
    document.querySelector('#local').innerText = bytesToFileSize(result.completedLength);
    document.querySelector('#ratio').innerText = ((result.completedLength / result.totalLength * 10000 | 0) / 100) + '%';
    document.querySelector('#remote').innerText = bytesToFileSize(result.totalLength);
    document.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
    document.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
    document.querySelector('#max-download-limit').disabled = stopped;
    document.querySelector('#max-upload-limit').disabled = stopped ?? !result.bittorrent;
    document.querySelector('#all-proxy').disabled = stopped;
}

function printTaskDetails(type) {
    if (logic === 0) {
        document.querySelectorAll('[http], [bt]').forEach(option => {
            option.style.display = option.hasAttribute(type) ? 'block' : 'none';
        });
        logic = 1;
    }
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

document.addEventListener('change', (event) => {
    changeTaskOption(gid, event.target.id, event.target.value);
});

document.querySelectorAll('[swap]').forEach(swap => {
    var input = document.getElementById(swap.getAttribute('swap'));
    swap.addEventListener('click', (event) => {
        if (!input.disabled) {
            swap.style.display = 'none';
            input.parentNode.style.display = 'block';
            input.focus();
        }
    });
    input.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
            input.parentNode.style.display = 'none';
            swap.style.display = 'block';
        }
    });
});

document.querySelector('#name').addEventListener('click', (event) => {
    frameElement.remove();
});

document.querySelector('[feed="all-proxy"]').addEventListener('click', (event) => {
    changeTaskOption(gid, 'all-proxy', aria2RPC.option.proxy['uri']);
});

document.querySelector('#http').addEventListener('click', (event) => {
    if (event.ctrlKey) {
        jsonRPCRequest({method: 'aria2.changeUri', gid, remove: event.target.innerText});
    }
    else {
        navigator.clipboard.writeText(event.target.innerText);
    }
});

document.querySelector('#source > span').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.changeUri', gid, add: document.querySelector('#source > input').value},
        (result) => {
            document.querySelector('#source > input').value = '';
        }
    );
});

document.querySelector('#bt').addEventListener('click', (event) => {
    if (event.target.className) {
        var checked = [];
        document.querySelectorAll('td:nth-child(1)').forEach(item => {
            if (item === event.target && item.className !== 'active' || item !== event.target && item.className === 'active') {
                checked.push(item.innerText);
            }
        });
        changeTaskOption(gid, 'select-file', checked.join());
    }
});

function printTaskOption(gid) {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            document.querySelectorAll('[task]').forEach(task => parseValueToOption(task, options));
        }
    );
}

function changeTaskOption(gid, name, value) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeOption', gid, options});
}
