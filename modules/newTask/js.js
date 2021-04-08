document.querySelector('#setProxy').addEventListener('click', (event) => {
    document.querySelector('#taskProxy').value = localStorage['allproxy'];
});

document.querySelector('#submit_btn').addEventListener('click', (event) => {
    var referer = document.querySelector('#taskReferer').value;
    var options = {'all-proxy': document.querySelector('#taskProxy').value};
    document.querySelector('#taskBatch').value.split('\n').forEach(url => {
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
