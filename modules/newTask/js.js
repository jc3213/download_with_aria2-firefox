document.getElementById('setProxy').addEventListener('click', (event) => {
    document.getElementById('taskProxy').value = localStorage['allproxy'];
});

document.getElementById('submit_btn').addEventListener('click', (event) => {
    var referer = document.getElementById('taskReferer').value;
    var options = {'all-proxy': document.getElementById('taskProxy').value};
    var batch = document.getElementById('taskBatch').value;
    try {
        batch = JSON.parse(batch);
        if (Array.isArray(batch)) {
            batch.forEach(task => downWithAria2({...task, referer}, options));
        }
        else {
            downWithAria2({...batch, referer}, options);
        }
    }
    catch(error) {
        batch.split('\n').forEach(url => downWithAria2({url, referer}, options));
    }
    parent.window.postMessage({id: 'newTaskWindow', delay: 1000});
});
