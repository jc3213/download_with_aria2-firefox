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
                document.querySelector('#taskFiles').innerHTML = printTaskFiles(result.files);
            }
            else {
                printTaskDetails('http');
                document.querySelector('#taskUris').innerHTML = printTaskUris(result.files[0].uris);
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

    function printTaskFiles(files) {
        var fileInfo = '<table>';
        files.forEach(file => {
            var filename = file.path.slice(file.path.lastIndexOf('/') + 1);
            var filePath = file.path.replace(/\//g, '\\');
            var fileSize = bytesToFileSize(file.length);
            var fileRatio = ((file.completedLength / file.length * 10000 | 0) / 100) + '%';
            var status = file.selected === 'true' ? 'active' : 'error';
            fileInfo += '<tr><td class="' + status + '">' + file.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
        });
        return fileInfo + '</table>';
    }

    function printTaskUris(uris) {
        var uriInfo = '<table>';
        var url = [];
        uris.forEach(uri => {
            if (!url.includes(uri.uri)) {
                var status = uri.status === 'used' ? 'active' : 'waiting';
                url.push(uri.uri);
                uriInfo += '<tr><td class="' + status + '">' + uri.uri + '</td></tr>';
            }
        });
        return uriInfo + '</table>';
    }

    function printTaskDetails(type) {
        if (logic !== 1) {
            document.querySelectorAll('[http], [bt]').forEach(option => {
                option.style.display = option.hasAttribute(type) ? 'block' : 'none';
            });
            logic = 1;
        }
    }
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

document.querySelector('#taskUris').addEventListener('click', (event) => {
    if (event.ctrlKey) {
        jsonRPCRequest({method: 'aria2.changeUri', gid, remove: event.target.innerText});
    }
    else {
        navigator.clipboard.writeText(event.target.innerText);
    }
});

document.querySelector('#taskAddUri > span').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.changeUri', gid, add: document.querySelector('#taskAddUri > input').value},
        (result) => {
            document.querySelector('#taskAddUri > input').value = '';
        }
    );
});

document.querySelector('#taskFiles').addEventListener('click', (event) => {
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
