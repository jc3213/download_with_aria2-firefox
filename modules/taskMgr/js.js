var gid;
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
            var completedLength = bytesToFileSize(result.completedLength);
            var estimatedTime = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
            var totalLength = bytesToFileSize(result.totalLength);
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
            var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100) + '%';
            var fileName = result.files[0].path.slice(result.files[0].path.lastIndexOf('/') + 1);
            if (result.bittorrent) {
                var taskUrl = '';
                var taskName = result.bittorrent.info ? result.bittorrent.info.name : fileName;
                document.querySelector('#bt').style.display = 'block';
                document.querySelector('#taskFiles').innerHTML = printTaskFiles(result.files);
            }
            else {
                taskUrl = result.files[0].uris[0].uri;
                taskName = fileName || taskUrl;
                document.querySelector('#http').style.display = 'block';
                document.querySelector('#taskUris').innerHTML = printTaskUris(result.files[0].uris);
            }
            document.querySelector('#title').className = result.status + 'Box title';
            document.querySelector('#name').innerText = taskName;
            document.querySelector('#name').className = result.status;
            document.querySelector('#name').style.width = completeRatio;
            document.querySelector('#local').innerText = completedLength;
            document.querySelector('#remote').innerText = completedLength;
            document.querySelector('#time').innerText = estimatedTime;
            document.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
            document.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
            //document.querySelector('#max-download-limit').disabled = completed;
            //document.querySelector('#max-upload-limit').disabled = !result.bittorrent || completed;
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
}

document.querySelectorAll('[task]').forEach(aria2 => {
    aria2.addEventListener('change', (event) => {
        changeTaskOption(gid, aria2.id, aria2.value || '');
    });
});

document.querySelectorAll('[swap]').forEach(swap => {
    var input = document.getElementById(swap.getAttribute('swap'));
    swap.addEventListener('click', (event) => {
        swap.style.display = 'none';
        input.parentNode.style.display = 'block';
        input.focus();
    });
    input.addEventListener('keydown', (event) => {
        if (event.keyCode === 13) {
            input.parentNode.style.display = 'none';
            swap.style.display = 'block';
        }
    });
});

document.querySelector('#back_btn').addEventListener('click', (event) => {
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
        changeTaskOption(gid, 'select-file', checked.join());
    }
});
