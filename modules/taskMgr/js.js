var gid;
var url;
var taskManager;

addEventListener('message', (event) => {
    gid = event.data.gid;
    url = event.data.url;
    printTaskOption();
    printTaskManager();
    taskManager = setInterval(printTaskManager, 1000);
})

function printTaskManager() {
    jsonRPCRequest(
        {method: 'aria2.tellStatus', gid},
        (result) => {
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
            var fileName = result.files[0].path ? result.files[0].path.match(/[^\/]+$/)[0] : '';
            var completed = result.status === 'complete';
            if (result.bittorrent) {
                var taskName = result.bittorrent.info ? result.bittorrent.info.name : fileName;
                document.getElementById('taskFiles').style.display = 'block';
                document.getElementById('taskFiles').innerHTML = printTaskFiles(result.files);
            }
            else {
                taskName = fileName || task.files[0].uris[0].uri;
                document.getElementById('taskUris').style.display = 'block';
                document.getElementById('taskUris').innerHTML = printTaskUris(result.files[0].uris);
            }
            document.getElementById('download').innerText = downloadSpeed;
            document.getElementById('max-download-limit').disabled = completed;
            document.getElementById('upload').innerText = uploadSpeed;
            document.getElementById('max-upload-limit').disabled = !result.bittorrent || completed;
            document.getElementById('all-proxy').disabled = completed;
            document.getElementById('taskName').innerText = taskName;
            document.getElementById('taskName').className = 'button title ' + result.status;
        }
    );

    function printTaskFiles(files) {
        var fileInfo = '<table>';
        files.forEach(file => {
            var filename = file.path.match(/[^\/]+$/)[0];
            var filePath = file.path.replace(/\//g, '\\');
            var fileSize = bytesToFileSize(file.length);
            var fileRatio = ((file.completedLength / file.length * 10000 | 0) / 100) + '%';
            fileInfo += '<tr><td>' + file.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
        });
        return fileInfo + '</table>';
    }

    function printTaskUris(uris) {
        var uriInfo = '<div><table>';
        var uriUsed = [];
        uris.forEach(uri => {
            if (uri.status === 'used' && !uriUsed.includes(uri.uri)) {
                uriUsed.push(uri.uri);
                uriInfo += '<tr><td>' + uri.uri + '</td></tr>';
            }
        });
        return uriInfo + '</table></div>';
    }
}

var taskOptions = [
    {id: 'max-download-limit', value: '0'},
    {id: 'max-upload-limit', value: '0'},
    {id: 'all-proxy', value: '' }
];
taskOptions.forEach(item => document.getElementById(item.id).addEventListener('change', (event) => changeTaskOption(item.id, event.target.value || item.value)));

function changeTaskOption(name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeOption', gid, options}, printTaskOption);
}

function printTaskOption() {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            taskOptions.forEach(item => { document.getElementById(item.id).value = options[item.id] || item.value; });
        }
    );
}

document.getElementById('loadProxy').addEventListener('click', (event) => {
    if (!document.getElementById('all-proxy').disabled) {
        changeTaskOption('all-proxy', localStorage['allproxy']);
    }
});

document.getElementById('taskName').addEventListener('click', (event) => {
    parent.window.postMessage({id: 'taskMgrWindow'});
});

document.getElementById('taskUris').addEventListener('click', (event) => {
    var url = event.target.innerText;
    navigator.clipboard.writeText(url);
    showNotification(browser.i18n.getMessage('warn_url_copied'), url);
});
