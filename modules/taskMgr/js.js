var gid;
var logic = 0;
var taskManager;

addEventListener('message', (event) => {
    gid = event.data;
    printTaskOptions(gid);
    printTaskManager();
    taskManager = setInterval(printTaskManager, 1000);
})

function printTaskManager() {
    jsonRPCRequest(
        {method: 'aria2.tellStatus', gid},
        (result) => {
            var completed = result.status === 'complete';
            if (result.bittorrent) {
                printTaskDetails('bt');
                result.files.forEach(file => printTaskFiles(file, document.querySelector('#file')));
            }
            else {
                printTaskDetails('http');
                result.files[0].uris.forEach(uri => printTaskUris(uri, document.querySelector('#uri')));
            }
            document.querySelector('#name').innerText = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.slice(result.files[0].path.lastIndexOf('/') + 1) || result.files[0].uris[0].uri;
            document.querySelector('#name').className = result.status + ' button';
            document.querySelector('#local').innerText = bytesToFileSize(result.completedLength);
            document.querySelector('#ratio').innerText = ((result.completedLength / result.totalLength * 10000 | 0) / 100) + '%';
            document.querySelector('#remote').innerText = bytesToFileSize(result.totalLength);
            document.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
            document.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
            document.querySelector('#max-download-limit').disabled = completed;
            document.querySelector('#max-upload-limit').disabled = completed || !result.bittorrent;
            document.querySelector('#all-proxy').disabled = completed;
        }
    );
}

function printTaskDetails(type) {
    if (logic !== 1) {
        document.querySelectorAll('[http], [bt]').forEach(option => {
            option.style.display = option.hasAttribute(type) ? 'block' : 'none';
        });
        logic = 1;
    }
}

function appendCelltoTable(id, table) {
    var cell = document.getElementById(id) || table.querySelector('#template').cloneNode(true);
    cell.id = id;
    table.appendChild(cell);
    return cell;
}

function printTaskUris(uri, table) {
    var id = uri.uri.split('/')[3];
    var cell = appendCelltoTable(id, table);
    cell.querySelector('td').innerText = uri.uri;
    cell.querySelector('td').className = uri.status === 'used' ? 'active' : 'waiting';
}

function printTaskFiles(file, table) {
    var id = file.index + file.length;
    var cell = appendCelltoTable(id, table);
    cell.querySelector('#index').innerText = file.index;
    cell.querySelector('#index').className = file.selected === 'true' ? 'active' : 'error';
    cell.querySelector('#name').innerText = file.path.slice(file.path.lastIndexOf('/') + 1);
    cell.querySelector('#name').title = file.path;
    cell.querySelector('#size').innerText = bytesToFileSize(file.length);
    cell.querySelector('#ratio').innerText = ((file.completedLength / file.length * 10000 | 0) / 100) + '%';
}

document.querySelectorAll('[task]').forEach(aria2 => {
    aria2.addEventListener('change', (event) => {
        changeTaskOption(gid, aria2.id, aria2.value || '');
    });
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
    parent.document.querySelector('#taskMgrWindow').remove();
});

document.querySelector('#allproxy').addEventListener('click', (event) => {
    changeTaskOption(gid, 'all-proxy', document.querySelector('#all-proxy').value);
});

document.querySelector('#uri').addEventListener('click', (event) => {
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

document.querySelector('#file').addEventListener('click', (event) => {
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
