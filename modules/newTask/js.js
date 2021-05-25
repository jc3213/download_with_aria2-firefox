jsonRPCRequest(
    {method: 'aria2.getGlobalOption'},
    (global) => {
        document.querySelectorAll('[aria2]').forEach(aria2 => {
            aria2.value = global[aria2.id] || '';
        });
    }
);

document.querySelector('#setProxy').addEventListener('click', (event) => {
    document.querySelector('#all-proxy').value = localStorage['allproxy'];
});

document.querySelector('#submit_btn').addEventListener('click', (event) => {
    var referer = document.querySelector('#taskReferer').value;
    var options = {};
    document.querySelectorAll('[option], [aria2]').forEach(option => {
        options[option.id] = option.value;
    });
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
