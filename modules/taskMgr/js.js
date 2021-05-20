var gid;
var taskManager;

addEventListener('message', (event) => {
    gid = event.data.gid;
    printTaskOption();
    printTaskManager();
    taskManager = setInterval(printTaskManager, 1000);
})

function printTaskManager() {
    jsonRPCRequest(
        {method: 'aria2.tellStatus', gid},
        (result) => {
            var fileName = result.files[0].path ? result.files[0].path.match(/[^\/]+$/)[0] : '';
            var completed = result.status === 'complete';
            if (result.bittorrent) {
                var taskName = result.bittorrent.info ? result.bittorrent.info.name : fileName;
                document.querySelector('#taskFiles').style.display = 'block';
                document.querySelector('#taskFiles').innerHTML = printTaskFiles(result.files);
            }
            else {
                taskName = fileName || result.files[0].uris[0].uri;
                document.querySelector('#taskUris').style.display = 'block';
                document.querySelector('#taskAddUri').style.display = 'block';
                document.querySelector('#taskUris').innerHTML = printTaskUris(result.files[0].uris);
            }
            document.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
            document.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
            document.querySelector('#max-download-limit').disabled = completed;
            document.querySelector('#max-upload-limit').disabled = !result.bittorrent || completed;
            document.querySelector('#all-proxy').disabled = completed;
            document.querySelector('#taskName').innerText = taskName;
            document.querySelector('#taskName').className = 'button title ' + result.status;
        }
    );

    function printTaskFiles(files) {
        var fileInfo = '<table>';
        files.forEach(file => {
            var filename = file.path.match(/[^\/]+$/)[0];
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
}

document.querySelectorAll('[option]').forEach(option => {
    option.addEventListener('change', (event) => {
        changeTaskOption(option.id, event.target.value || option.getAttribute('option'));
    });
});

function changeTaskOption(name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeOption', gid, options}, printTaskOption);
}

function printTaskOption() {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            document.querySelectorAll('[option]').forEach(option => {
                option.value = options[option.id] || option.getAttribute('option');
            });
        }
    );
}

document.querySelector('#loadProxy').addEventListener('click', (event) => {
    if (!document.querySelector('#all-proxy').disabled) {
        changeTaskOption('all-proxy', localStorage['allproxy']);
    }
});

document.querySelector('#taskName').addEventListener('click', (event) => {
    parent.document.querySelector('#taskMgrWindow').remove();
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
        jsonRPCRequest({method: 'aria2.changeOption', gid, options: {'select-file': checked.join()}});
    }
});
