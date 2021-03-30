var gid;
var url;
var taskManager;

addEventListener('message', (event) => {
    gid = event.data.gid;
    url = event.data.url;
    printTaskOption();
    printTaskDetails();
    taskManager = setInterval(printTaskDetails, 1000);
})

function printTaskDetails() {
    jsonRPCRequest(
        {method: 'aria2.tellStatus', gid},
        (result) => {
            var completed = result.status === 'complete';
            var fileName = result.files[0].path ? result.files[0].path.match(/[^\/]+$/)[0] : '';
            if (result.bittorrent) {
                var taskName = result.bittorrent.info ? result.bittorrent.info.name : fileName;
            }
            else {
                taskName = fileName || url;
            }
            document.getElementById('taskName').innerText = taskName;
            document.getElementById('taskName').className = 'button title ' + result.status;
            document.getElementById('max-download-limit').disabled = completed;
            document.getElementById('max-upload-limit').disabled = !result.bittorrent || completed;
            document.getElementById('all-proxy').disabled = completed;
            document.getElementById('taskFiles').innerHTML = printFileInfo(result.files);
        }
    );

    function printFileInfo(files) {
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

document.getElementById('taskFiles').addEventListener('click', (event) => {
    if (url) {
        navigator.clipboard.writeText(url);
        showNotification(browser.i18n.getMessage('warn_url_copied'), url);
    }
});
