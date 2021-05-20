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
                if (session[0].constructor.name === 'String') {
                    downWithAria2({url: session, referer}, options);
                }
                else {
                    session.forEach(task => downWithAria2(referer ? {...task, referer} : task, options));
                }
            }
            else {
                downWithAria2(referer ? {...session, referer} : session, options);
            }
        }
        catch(error) {
            downWithAria2({url, referer}, options);
        }
    });
    parent.document.querySelector('#newTaskWindow').style.display = 'none';
    parent.document.querySelector('#newTask_btn').classList.remove('checked');
    setTimeout(() => {
        parent.document.querySelector('#newTaskWindow').remove();
    }, 1000);
});
