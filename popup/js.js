document.querySelectorAll('span[module]').forEach(module => {
    var moduleId = module.getAttribute('module');
    var moduleSrc = module.getAttribute('window');
    module.addEventListener('click', (event) => {
        if (moduleId === 'optionsWindow') {
            var moduleActive = (event) => {
                event.target.contentDocument.querySelector('#preferences').style.display = 'none';
            };
        }
        if (event.target.classList.contains('checked')) {
            document.getElementById(moduleId).remove();
        }
        else {
            openModuleWindow(moduleId, moduleSrc, moduleActive);
        }
        module.classList.toggle('checked');
    });
});

document.querySelectorAll('span.tab').forEach(tab => {
    tab.addEventListener('click', (event) => {
        document.querySelectorAll('div[tab]').forEach(body => {
            var tabId = body.getAttribute('tab');
            if (tab.classList.contains('checked')) {
                body.style.display = 'block';
            }
            else if (tabId === tab.id) {
                body.style.display = 'block';
            }
            else {
                body.style.display = 'none';
                document.getElementById(tabId).classList.remove('checked');
            }
        });
        tab.classList.toggle('checked');
    });
});

document.querySelector('#purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.purgeDownloadResult'},
        (result) => {
            document.querySelector('#stoppedQueue').innerHTML = '';
        }
    );
});

function printMainFrame() {
    jsonRPCRequest([
        {method: 'aria2.getGlobalStat'},
        {method: 'aria2.tellActive'},
        {method: 'aria2.tellWaiting', index: [0, 9999]},
        {method: 'aria2.tellStopped', index: [0, 9999]}
    ], (global, active, waiting, stopped) => {
        document.querySelector('#numActive').innerText = global.numActive;
        document.querySelector('#numWaiting').innerText = global.numWaiting;
        document.querySelector('#numStopped').innerText = global.numStopped;
        document.querySelector('#downloadSpeed').innerText = bytesToFileSize(global.downloadSpeed) + '/s';
        document.querySelector('#uploadSpeed').innerText = bytesToFileSize(global.uploadSpeed) + '/s';
        document.querySelector('#queueTabs').style.display = 'block';
        document.querySelector('#menuTop').style.display = 'block';
        document.querySelector('#networkStatus').style.display = 'none';
        active.forEach(active => printTaskInfo(active, document.querySelector('#activeQueue')));
        waiting.forEach(active => printTaskInfo(active, document.querySelector('#waitingQueue')));
        stopped.forEach(active => printTaskInfo(active, document.querySelector('#stoppedQueue')));
    }, (error, rpc) => {
        document.querySelector('#queueTabs').style.display = 'none';
        document.querySelector('#menuTop').style.display = 'none';
        document.querySelector('#networkStatus').innerText = error;
        document.querySelector('#networkStatus').style.display = 'block';
    });
}

function printTaskInfo(result, queue) {
    var task = document.getElementById(result.gid) || appendTaskInfo(result);
    task.status = result.status;
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
    queue.appendChild(task);
}

function appendTaskInfo(result) {
    var task = document.querySelector('#template').cloneNode(true);
    task.id = result.gid;
    task.querySelector('#name').innerText = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path.slice(result.files[0].path.lastIndexOf('/') + 1) || result.files[0].uris[0].uri;
    task.querySelector('#upload').parentNode.style.display = result.bittorrent ? 'inline-block' : 'none';
    task.querySelector('#remove_btn').addEventListener('click', (event) => removeTaskFromQueue(result.gid, task.status));
    task.querySelector('#invest_btn').addEventListener('click', (event) => openTaskMgrWindow(result.gid));
    task.querySelector('#retry_btn').addEventListener('click', (event) => removeTaskAndRetry(result.gid));
    task.querySelector('#fancybar').addEventListener('click', (event) => pauseOrUnpauseTask(result.gid, task.status));
    return task;
}

function calcEstimatedTime(task, number) {
    if (isNaN(number) || number === Infinity) {
        task.querySelector('#clock').innerHTML = '∞';
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
    }
}

function removeTaskFromQueue(gid, status) {
    if (['active', 'waiting', 'paused'].includes(status)) {
        var method = 'aria2.forceRemove';
    }
    else if (['complete', 'error', 'removed'].includes(status)) {
        method = 'aria2.removeDownloadResult';
        var clear = (result) => {
            document.getElementById(gid).remove();
        };
    }
    else {
        return;
    }
    jsonRPCRequest({method, gid}, clear);
}

function openTaskMgrWindow(gid) {
    openModuleWindow('taskMgrWindow', '/modules/taskMgr/index.html', (event) => {
        event.target.contentWindow.postMessage(gid);
    });
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
                downWithAria2({url}, options, true);
            });
        }
    );
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

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
