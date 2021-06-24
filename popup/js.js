document.querySelectorAll('[module]').forEach(module => {
    var id = module.getAttribute('module');
    var src = '/modules/' + id + '/index.html?from=popup';

    module.addEventListener('click', (event) => {
        if (event.target.classList.contains('checked')) {
            document.getElementById(id).remove();
        }
        else {
            openModuleWindow(id, src);
        }
        module.classList.toggle('checked');
    });
});

document.querySelectorAll('[tab]').forEach(tab => {
    var active = tab.getAttribute('tab');
    tab.addEventListener('click', (event) => {
        document.querySelectorAll('[panel]').forEach(panel => {
            var id = panel.getAttribute('panel');
            if (tab.classList.contains('checked')) {
                panel.style.display = 'block';
            }
            else if (id === active) {
                panel.style.display = 'block';
            }
            else {
                panel.style.display = 'none';
                document.querySelector('[tab="' + id + '"]').classList.remove('checked');
            }
        });
        tab.classList.toggle('checked');
    });
});

document.querySelector('#purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.purgeDownloadResult'},
        (result) => {
            document.querySelector('[panel="stopped"]').innerHTML = '';
        }
    );
});

function printTaskManager() {
    jsonRPCRequest([
        {method: 'aria2.getGlobalStat'},
        {method: 'aria2.tellActive'},
        {method: 'aria2.tellWaiting', index: [0, 9999]},
        {method: 'aria2.tellStopped', index: [0, 9999]}
    ], (global, active, waiting, stopped) => {
        document.querySelector('#active').innerText = global.numActive;
        document.querySelector('#waiting').innerText = global.numWaiting;
        document.querySelector('#stopped').innerText = global.numStopped;
        document.querySelector('#download').innerText = bytesToFileSize(global.downloadSpeed) + '/s';
        document.querySelector('#upload').innerText = bytesToFileSize(global.uploadSpeed) + '/s';
        document.querySelector('#menus').style.display = 'block';
        document.querySelector('#caution').style.display = 'none';
        active.forEach((active, index) => printTaskDetails(active, index, document.querySelector('[panel="active"]')));
        waiting.forEach((waiting, index) => printTaskDetails(waiting, index, document.querySelector('[panel="waiting"]')));
        stopped.forEach((stopped, index) => printTaskDetails(stopped, index, document.querySelector('[panel="stopped"]')));
    }, (error, jsonrpc) => {
        document.querySelector('#menus').style.display = 'none';
        document.querySelector('#caution').innerText = error;
        document.querySelector('#caution').style.display = 'block';
    });
}

function printTaskDetails(result, index, queue) {
    var task = document.getElementById(result.gid) || appendTaskDetails(result);
    if (task.status !== result.status) {
        queue.insertBefore(task, queue.childNodes[index]);
        task.status = result.status;
    }
    task.querySelector('#name').innerText = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.slice(result.files[0].path.lastIndexOf('/') + 1) || result.files[0].uris[0].uri;
    task.querySelector('#error').innerText = result.errorMessage || '';
    task.querySelector('#local').innerText = bytesToFileSize(result.completedLength);
    calcEstimatedTime(task, (result.totalLength - result.completedLength) / result.downloadSpeed);
    task.querySelector('#remote').innerText = bytesToFileSize(result.totalLength);
    task.querySelector('#connect').innerText = result.bittorrent ? result.numSeeders + ' (' + result.connections + ')' : result.connections;
    task.querySelector('#download').innerText = bytesToFileSize(result.downloadSpeed) + '/s';
    task.querySelector('#upload').innerText = bytesToFileSize(result.uploadSpeed) + '/s';
    task.querySelector('#fancybar').className = result.status + 'Box';
    task.querySelector('#ratio').innerText = task.querySelector('#ratio').style.width = ((result.completedLength / result.totalLength * 10000 | 0) / 100) + '%';
    task.querySelector('#ratio').className = result.status;
    task.querySelector('#retry_btn').style.display = !result.bittorrent && ['error', 'removed'].includes(result.status) ? 'inline-block' : 'none';
}

function appendTaskDetails(result) {
    var task = document.querySelector('#template').cloneNode(true);
    task.id = result.gid;
    task.querySelector('#upload').parentNode.style.display = result.bittorrent ? 'inline-block' : 'none';
    task.querySelector('#remove_btn').addEventListener('click', (event) => removeTaskFromQueue(result.gid, task.status));
    task.querySelector('#invest_btn').addEventListener('click', (event) => openTaskMgrWindow(result.gid));
    task.querySelector('#retry_btn').addEventListener('click', (event) => removeTaskAndRetry(result.gid));
    task.querySelector('#fancybar').addEventListener('click', (event) => pauseOrUnpauseTask(result.gid, task.status));
    return task;
}

function calcEstimatedTime(task, number) {
    if (isNaN(number) || number === Infinity) {
        task.querySelector('#infinite').style.display = 'inline-block';
        task.querySelector('#estimate').style.display = 'none';
    }
    else {
        var days = number / 86400 | 0;
        var hours = number / 3600 - days * 24 | 0;
        var minutes = number / 60 - days * 1440 - hours * 60 | 0;
        var seconds = number - days * 86400 - hours * 3600 - minutes * 60 | 0;
        task.querySelector('#day').innerText = days;
        task.querySelector('#day').parentNode.style.display = days > 0 ? 'inline-block' : 'none';
        task.querySelector('#hour').innerText = hours;
        task.querySelector('#hour').parentNode.style.display = hours > 0 ? 'inline-block' : 'none';
        task.querySelector('#minute').innerText = minutes;
        task.querySelector('#minute').parentNode.style.display = minutes > 0 ? 'inline-block' : 'none';
        task.querySelector('#second').innerText = seconds;
        task.querySelector('#infinite').style.display = 'none';
        task.querySelector('#estimate').style.display = 'inline-block';
    }
}

function removeTaskFromQueue(gid, status) {
    if (['active', 'waiting', 'paused'].includes(status)) {
        var method = 'aria2.forceRemove';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
    }
    else {
        return;
    }
    if (['complete', 'error', 'paused', 'removed'].includes(status)) {
        var clear = (result) => {
            document.getElementById(gid).remove();
        };
    }
    jsonRPCRequest({method, gid}, clear);
}

function openTaskMgrWindow(gid) {
    openModuleWindow('taskMgr', '/modules/taskMgr/index.html?gid=' + gid);
}

function removeTaskAndRetry(gid) {
    jsonRPCRequest([
        {method: 'aria2.getFiles', gid},
        {method: 'aria2.getOption', gid}
    ], (files, options) => {
        var url = [];
        files[0].uris.forEach(uri => {
            if (!url.includes(uri.uri)) {
                url.push(uri.uri);
            }
        });
        jsonRPCRequest({method: 'aria2.removeDownloadResult', gid}, () => {
            document.getElementById(gid).remove();
            jsonRPCRequest({method: 'aria2.addUri', url, options});
        });
    });
}

function pauseOrUnpauseTask(gid, status) {
    if (['active', 'waiting'].includes(status)) {
        var method = 'aria2.pause';
    }
    else if (status === 'paused') {
        method = 'aria2.unpause';
    }
    else {
        return;
    }
    jsonRPCRequest({method, gid});
}

printTaskManager();
var keepContentAlive = setInterval(printTaskManager, 1000);
