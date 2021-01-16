var gid;
var url;
var taskManager;

window.addEventListener('message', (event) => {
    gid = event.data;
    printTaskOption();
    printTaskDetails();
    taskManager = setInterval(printTaskDetails, 1000);
})

function printTaskDetails() {
    jsonRPCRequest(
        {method: 'aria2.tellStatus', gid: gid},
        (result) => {
            var complete = result.status === 'complete';
            var fileName = result.files[0].path.split('/').pop();
            if (result.bittorrent) {
                var taskUrl = '';
                var taskName = result.bittorrent.info ? result.bittorrent.info.name : fileName;
            }
            else {
                url = taskUrl = result.files[0].uris[0].uri;
                taskName = fileName || taskUrl;
            }
            document.getElementById('taskName').innerText = taskName;
            document.getElementById('taskName').className = 'button title ' + result.status;
            document.getElementById('max-download-limit').disabled = complete;
            document.getElementById('max-upload-limit').disabled = !result.bittorrent || complete;
            document.getElementById('all-proxy').disabled = result.bittorrent || complete;
            document.getElementById('taskFiles').innerHTML = printFileInfo(result.files);
        }
    );

    function printFileInfo(files) {
        var fileInfo = '<table>';
        files.forEach(file => {
            var filename = (file.path || url).split('/').pop();
            var filePath = file.path.replace(/\//g, '\\');
            var fileSize = bytesToFileSize(file.length);
            var fileRatio = ((file.completedLength / file.length * 10000 | 0) / 100).toString() + '%';
            fileInfo += '<tr><td>' + file.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
        });
        return fileInfo + '</table>';
    }
}

var taskOptions = [
    {id: 'max-download-limit', value: '0'},
    {id: 'max-upload-limit', value: '0'},
    {id: 'all-proxy', value: '' }
];
taskOptions.forEach(item => document.getElementById(item.id).addEventListener('change', (event) => changeTaskOption(item.id, event.target.value, item.value)));

function changeTaskOption(name, value, initial) {
    var options = {};
    options[name] = value || initial;
    jsonRPCRequest({method: 'aria2.changeOption', gid: gid, options: options}, printTaskOption);
}

function printTaskOption() {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid: gid},
        (result) => {
            taskOptions.forEach(item => { document.getElementById(item.id).value = result[item.id] || item.value; });
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

document.getElementById('taskFiles').addEventListener('click', (event) => {
    if (url) {
        navigator.clipboard.writeText(url);
        showNotification(browser.i18n.getMessage('warn_url_copied'), url);
    }
});
