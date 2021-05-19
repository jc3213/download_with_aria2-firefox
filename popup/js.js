addEventListener('message', (event) => {
    document.getElementById(event.data.id).style.display = 'none';
    setTimeout(() => {
        document.getElementById(event.data.id).remove()
    }, event.data.delay | 0);
    document.querySelectorAll('span[module]').forEach(module => {
        if (module.id === event.data.id) {
            module.classList.remove('checked');
        }
    });
});

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

function openModuleWindow(id, src, onload) {
    console.log(id, src, onload);
    var iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;
    if (typeof onload === 'function') {
        iframe.addEventListener('load', onload);
    }
    document.body.appendChild(iframe);
}

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

document.getElementById('purdge_btn').addEventListener('click', (event) => {
    jsonRPCRequest({method: 'aria2.purgeDownloadResult'});
});

function printMainFrame() {
    jsonRPCRequest([
        {method: 'aria2.getGlobalStat'},
        {method: 'aria2.tellActive'},
        {method: 'aria2.tellWaiting', index: [0, 9999]},
        {method: 'aria2.tellStopped', index: [0, 9999]}
    ], (global, active, waiting, stopped) => {
        document.getElementById('numActive').innerText = global.numActive;
        document.getElementById('numWaiting').innerText = global.numWaiting;
        document.getElementById('numStopped').innerText = global.numStopped;
        document.getElementById('downloadSpeed').innerText = bytesToFileSize(global.downloadSpeed) + '/s';
        document.getElementById('uploadSpeed').innerText = bytesToFileSize(global.uploadSpeed) + '/s';
        document.getElementById('queueTabs').style.display = 'block';
        document.getElementById('menuTop').style.display = 'block';
        document.getElementById('networkStatus').style.display = 'none';
        document.getElementById('activeQueue').innerHTML = printTaskQueue(active);
        document.getElementById('waitingQueue').innerHTML = printTaskQueue(waiting);
        document.getElementById('stoppedQueue').innerHTML = printTaskQueue(stopped);
    }, (error, rpc) => {
        document.getElementById('queueTabs').style.display = 'none';
        document.getElementById('menuTop').style.display = 'none';
        document.getElementById('networkStatus').innerText = error;
        document.getElementById('networkStatus').style.display = 'block';
    });

    function printTaskQueue(queue, taskInfo = '') {
        queue.forEach(result => {
            var completedLength = bytesToFileSize(result.completedLength);
            var estimatedTime = numberToTimeFormat((result.totalLength - result.completedLength) / result.downloadSpeed);
            var totalLength = bytesToFileSize(result.totalLength);
            var downloadSpeed = bytesToFileSize(result.downloadSpeed) + '/s';
            var uploadSpeed = bytesToFileSize(result.uploadSpeed) + '/s';
            var completeRatio = ((result.completedLength / result.totalLength * 10000 | 0) / 100) + '%';
            var fileName = result.files[0].path ? result.files[0].path.match(/[^\/]+$/)[0] : '';
            var errorMessage = result.errorCode ? ' <error style="color: #f00; font-size: 11px;">' + result.errorMessage + '</error>' : '';
            if (result.bittorrent) {
                var taskUrl = '';
                var taskName = result.bittorrent.info ? result.bittorrent.info.name : fileName;
                var connections = result.numSeeders + ' (' + result.connections + ')';
                var uploadShow = 'inline-block';
                var retryButton = 'none';
            }
            else {
                taskUrl = result.files[0].uris[0].uri;
                taskName = fileName || taskUrl;
                connections = result.connections;
                uploadShow = 'none';
                retryButton = ['error', 'removed'].includes(result.status) ? 'inline-block' : 'none';
            }
            taskInfo += '\
            <div class="taskInfo" gid="' + result.gid + '" status="' + result.status + '">\
                <div class="taskBody">\
                    <div class="title">' + taskName + errorMessage + '</div>\
                    <span>🖥️ ' + completedLength + '</span><span>⏲️ ' + estimatedTime + '</span><span>📦 ' + totalLength + '</span>\
                    <span>📶 ' + connections + '</span><span>⏬ ' + downloadSpeed + '</span><span style="display: ' + uploadShow + '">⏫ ' + uploadSpeed + '</span>\
                </div><div class="taskMenu">\
                    <span class="button" id="remove_btn">❌</span>\
                    <span class="button" id="invest_btn">🔍</span>\
                    <span class="button" id="retry_btn" style="display: ' + retryButton + '">🌌</span>\
                </div><div id="fancybar" class="' + result.status + 'Box">\
                    <div id="fancybar" class="' + result.status + '" style="width: ' + completeRatio + '">' + completeRatio + '</div>\
                </div>\
            </div>';
        });
        return taskInfo;
    }
}

document.getElementById('taskQueue').addEventListener('click', (event) => {
    if (event.target.id === 'remove_btn') {
        var {gid, status} = getTaskInfo();
        if (['active', 'waiting', 'paused'].includes(status)) {
            var method = 'aria2.forceRemove';
        }
        else if (['complete', 'error', 'removed'].includes(status)) {
            method = 'aria2.removeDownloadResult';
        }
        else {
            return;
        }
        jsonRPCRequest({method, gid});
    }
    else if (event.target.id === 'invest_btn') {
        var {gid} = getTaskInfo();
        openModuleWindow('taskMgrWindow', '/modules/taskMgr/index.html', (event) => {
            event.target.contentWindow.postMessage({gid});
        });
    }
    else if (event.target.id === 'retry_btn') {
        var {gid} = getTaskInfo();
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
                    downWithAria2({url}, options, true);
                });
            }
        );
    }
    else if (event.target.id === 'fancybar') {
        var {gid, status} = getTaskInfo();
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

    function getTaskInfo(info) {
        document.querySelectorAll('div.taskInfo').forEach(item => {
            if (item.contains(event.target)) {
                info = {gid: item.getAttribute('gid'), status: item.getAttribute('status')};
            }
        });
        return info;
    }
});

printMainFrame();
var keepContentAlive = setInterval(printMainFrame, 1000);
