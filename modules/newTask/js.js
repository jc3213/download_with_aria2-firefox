document.getElementById('taskProxy').value = localStorage['allproxy'];

document.getElementById('setProxy').addEventListener('click', (event) => {
    document.getElementById('taskProxy').disabled = !document.getElementById('taskProxy').disabled;
});

document.getElementById('submit_btn').addEventListener('click', (event) => {
    var referer = document.getElementById('taskReferer').value;
    var checked = document.getElementById('setProxy').checked;
    var proxy = document.getElementById('taskProxy').value;
    var batch = document.getElementById('taskBatch').value;
    try {
        batch = JSON.parse(batch);
        if (Array.isArray(batch)) {
            batch.forEach(task => downloadNewTask(task));
        }
        else {
            downloadNewTask(batch);
        }
    }
    catch(error) {
        batch.split('\n').forEach(url => downloadNewTask({url}));
    }
    parent.window.postMessage({id: 'newTaskWindow', delay: 1000});

    function downloadNewTask(task, options = {}) {
        if (!task.url) {
            return;
        }
        var url = task.url;
        if (checked && proxy) {
            options['all-proxy'] = proxy;
        }
        if (task.filename) {
            options['out'] = task.filename;
        }
        if (task.folder) {
            options['dir'] = task.folder;
        }
        downWithAria2({url, referer}, options);
    }
});
