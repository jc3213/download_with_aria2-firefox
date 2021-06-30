document.querySelectorAll('[module]').forEach(module => {
    var id = module.getAttribute('module');
    var src = '/modules/' + id + '/index.html?popup';

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
    browser.runtime.sendMessage({request: {id: '', jsonrpc: 2, method: 'aria2.purgeDownloadResult', params: [aria2RPC.options.jsonrpc['token']]}});
    purgeTaskQueue();
});

document.querySelector('div.queue').addEventListener('click', (event) => {
    var {gid, status} = window.aria2Session;
    if (event.target.id === 'remove_btn') {
        removeTaskFromQueue(gid, status);
    }
    if (event.target.id === 'invest_btn') {
        openModuleWindow('taskMgr', '/modules/taskMgr/index.html');
    }
    if (event.target.id === 'retry_btn') {
        removeAndRestartTask(gid);
    }
    if (event.target.id === 'fancybar') {
        pauseOrUnpauseTask(gid, status);
    }
});

browser.runtime.sendMessage({jsonrpc: true}, printTaskManager);
browser.runtime.connect({name: 'download-manager'}).onMessage.addListener(printTaskManager);

function printTaskManager(message) {
    aria2RPC = message;
    var {globalStat, active, waiting, stopped, error} = aria2RPC;
    if (globalStat) {
        document.querySelector('#active').innerText = globalStat.numActive;
        document.querySelector('#waiting').innerText = globalStat.numWaiting;
        document.querySelector('#stopped').innerText = globalStat.numStopped;
        document.querySelector('#download').innerText = bytesToFileSize(globalStat.downloadSpeed) + '/s';
        document.querySelector('#upload').innerText = bytesToFileSize(globalStat.uploadSpeed) + '/s';
        document.querySelector('#menus').style.display = 'block';
        document.querySelector('#caution').style.display = 'none';
        active.forEach(printTaskDetails);
        waiting.forEach(printTaskDetails);
        stopped.forEach(printTaskDetails);
    }
    if (error) {
        document.querySelector('#menus').style.display = 'none';
        document.querySelector('#caution').innerText = error;
        document.querySelector('#caution').style.display = 'block';
        document.querySelector('[panel="active"]').innerHTML = '';
        document.querySelector('[panel="waiting"]').innerHTML = '';
        document.querySelector('[panel="stopped"]').innerHTML = '';
    }
}

function printTaskDetails(result, index) {
    var task = document.getElementById(result.gid) ?? appendTaskDetails(result);
    if (task.status !== result.status) {
        var type = result.status === 'active' ? 'active' : ['waiting', 'paused'].includes(result.status) ? 'waiting' : 'stopped';
        var queue = document.querySelector('[panel="' + type + '"]');
        queue.insertBefore(task, queue.childNodes[index]);
        task.status = result.status;
    }
    task.querySelector('#name').innerText = result.bittorrent && result.bittorrent.info ? result.bittorrent.info.name : result.files[0].path ? result.files[0].path.slice(result.files[0].path.lastIndexOf('/') + 1) : result.files[0].uris[0].uri;
    task.querySelector('#error').innerText = result.errorMessage ?? '';
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
    task.addEventListener('mouseenter', (event) => {
        window.aria2Session = {gid: result.gid, status: result.status};
        browser.runtime.sendMessage({session: result.gid});
    });
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

function purgeTaskQueue(gid) {
    browser.runtime.sendMessage({purge: true}, printTaskManager);
    gid ? document.getElementById(gid).remove() : document.querySelector('[panel="stopped"]').innerHTML = '';
}

function removeTaskFromQueue(gid, status) {
    var method = ['active', 'waiting', 'paused'].includes(status) ? 'aria2.forceRemove' :
        ['complete', 'error', 'removed'].includes(status) ? 'aria2.removeDownloadResult' : null;
    browser.runtime.sendMessage({request: {id: '', jsonrpc: 2, method, params: [aria2RPC.options.jsonrpc['token'], gid]}});
    if (['complete', 'error', 'paused', 'removed'].includes(status)) {
        purgeTaskQueue(gid);
    }
}

function removeAndRestartTask(gid) {
    browser.runtime.sendMessage({restart: {id: '', jsonrpc: 2, method: 'aria2.removeDownloadResult', params: [aria2RPC.options.jsonrpc['token'], gid]}});
    purgeTaskQueue(gid);
}

function pauseOrUnpauseTask(gid, status) {
    var method = ['active', 'waiting'].includes(status) ? 'aria2.pause' :
        status === 'paused' ? 'aria2.unpause' : null;
    browser.runtime.sendMessage({request: {id: '', jsonrpc: 2, method, params: [aria2RPC.options.jsonrpc['token'], gid]}});
}
