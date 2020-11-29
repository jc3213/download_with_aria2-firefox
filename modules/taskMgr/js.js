var gid;
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
            var taskUrl = result.bittorrent ? '' : result.files[0].uris[0].uri;
            var taskName = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.split('/').pop() || taskUrl;
            document.getElementById('taskName').innerHTML = taskName;
            document.getElementById('taskName').className = 'button title ' + result.status;
            document.getElementById('optionDownload').disabled = complete;
            document.getElementById('optionUpload').disabled = !result.bittorrent || complete;
            document.getElementById('optionProxy').disabled = result.bittorrent || complete;
            var taskFiles = result.files.map(item => printFileInfo(item));
            document.getElementById('taskFiles').innerHTML = '<table>' + taskFiles.join('') + '</table>';
        }
    );

    function printFileInfo(file) {
        var fileUrl = file.uris.length > 0 ? file.uris[0].uri : '';
        var filename = (file.path || fileUrl).split('/').pop();
        var filePath = file.path.replace(/\//g, '\\');
        var fileSize = bytesToFileSize(file.length);
        var fileRatio = ((file.completedLength / file.length * 10000 | 0) / 100).toString() + '%';
        return '<tr uri="' + fileUrl + '"><td>' + file.index + '</td><td title="' + filePath + '">' + filename + '</td><td>' + fileSize + '</td><td>' + fileRatio + '</td></tr>';
    }
}

var taskOptions = [
    {id: 'optionDownload', name: 'max-download-limit', value: '0'},
    {id: 'optionUpload', name: 'max-upload-limit', value: '0'},
    {id: 'optionProxy', name: 'all-proxy', value: '' }
];
taskOptions.forEach(item => document.getElementById(item.id).addEventListener('change', (event) => changeTaskOption(event.target.value, item.name, item.value)));

function changeTaskOption(value, name, initial) {
    var options = {};
    options[name] = value || initial;
    jsonRPCRequest({method: 'aria2.changeOption', gid: gid, options: options}, printTaskOption);
}

function printTaskOption() {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid: gid},
        (result) => {
            taskOptions.forEach(item => { document.getElementById(item.id).value = result[item.name] || item.value; });
        }
    );
}

document.getElementById('loadProxy').addEventListener('click', (event) => {
    if (!document.getElementById('optionProxy').disabled) {
        var allproxy = localStorage.getItem('allproxy') || '';
        changeTaskOption(allproxy, 'all-proxy');
    }
});

document.getElementById('taskName').addEventListener('click', (event) => {
    parent.window.postMessage({id: 'taskMgrWindow'});
});

document.getElementById('taskFiles').addEventListener('click', (event) => {
    var uri;
    document.querySelectorAll('tr').forEach((item, index)=> { if (item.contains(event.target)) uri = item.getAttribute('uri'); });
    if (uri) {
        navigator.clipboard.writeText(uri);
        showNotification(window['warn_url_copied'], uri);
    }
});
