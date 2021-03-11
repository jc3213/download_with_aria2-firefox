document.getElementById('setProxy').addEventListener('click', (event) => {
    document.getElementById('taskProxy').value = localStorage['allproxy'];
});

document.getElementById('submit_btn').addEventListener('click', (event) => {
    var referer = document.getElementById('taskReferer').value;
    var options = {'all-proxy': document.getElementById('taskProxy').value};
    document.getElementById('taskBatch').value.split('\n').forEach(url => {
        try {
            var session = JSON.parse(url);
            if (Array.isArray(session)) {
                session.forEach(task => downWithAria2(referer ? {...task, referer} : task, options));
            }
            else {
                downWithAria2(referer ? {...session, referer} : session, options);
            }
        }
        catch(error) {
            downWithAria2({url, referer}, options);
        }
    });
    parent.window.postMessage({id: 'newTaskWindow', delay: 1000});
});
