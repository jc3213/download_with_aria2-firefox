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
    if (event.target.id === 'remove_btn') {
        removeTaskFromQueue();
    }
    if (event.target.id === 'invest_btn') {
        openModuleWindow('taskMgr', '/modules/taskMgr/index.html');
    }
    if (event.target.id === 'retry_btn') {
        removeAndRestartTask();
    }
    if (event.target.id === 'fancybar') {
        pauseOrUnpauseTask();
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
        __gid = task.id;
        __status = task.status;
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
    if (gid) {
        document.getElementById(gid).remove()
    }
    else {
        document.querySelector('[panel="stopped"]').innerHTML = '';
    }
    if (aria2RPC.globalStat) {
        browser.runtime.sendMessage({purge: true}, printTaskManager);
    }
}

function removeTaskFromQueue() {
    var method = ['active', 'waiting', 'paused'].includes(__status) ? 'aria2.forceRemove' :
        ['complete', 'error', 'removed'].includes(__status) ? 'aria2.removeDownloadResult' : null;
    if (method) {
        browser.runtime.sendMessage({request: {id: '', jsonrpc: 2, method, params: [aria2RPC.options.jsonrpc['token'], __gid]}});
    }
    if (['complete', 'error', 'paused', 'removed'].includes(__status)) {
        purgeTaskQueue(__gid);
    }
}

function removeAndRestartTask() {
    browser.runtime.sendMessage({restart: {id: '', jsonrpc: 2, method: 'aria2.removeDownloadResult', params: [aria2RPC.options.jsonrpc['token'], __gid]}});
    purgeTaskQueue(__gid);
}

function pauseOrUnpauseTask() {
    var method = ['active', 'waiting'].includes(__status) ? 'aria2.pause' :
        __status === 'paused' ? 'aria2.unpause' : null;
    if (method) {
        browser.runtime.sendMessage({request: {id: '', jsonrpc: 2, method, params: [aria2RPC.options.jsonrpc['token'], __gid]}});
    }
}
