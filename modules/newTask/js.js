document.querySelector('#submit_btn').addEventListener('click', (event) => {
    var referer = document.querySelector('#referer').value;
    var options = {};
    document.querySelectorAll('[option], [aria2]').forEach(field => {
        options[field.id] = field.value;
    });
    document.querySelector('#entries').value.split('\n').forEach(result => {
        try {
            var session = JSON.parse(result);
            if (Array.isArray(session)) {
                if (typeof session[0] === 'string') {
                    submitNewDownload({url: session, referer}, options);
                }
                else {
                    session.forEach(task => submitNewDownload(referer ? {...task, referer} : task, options));
                }
            }
            else {
                submitNewDownload(referer ? {...session, referer} : session, options);
            }
        }
        catch(error) {
            result.split('\n').forEach(url => submitNewDownload({url, referer}, options));
        }
    });
    parent.document.querySelector('[module="' + frameElement.id + '"]').classList.remove('checked');
    frameElement.style.display = 'none';
    setTimeout(() => frameElement.remove(), 500);
});

function submitNewDownload(session, options) {
    downloadWithAria2(session, options);
}

aria2RPCLoader(() => {
    printGlobalOption();
    feedEventHandler();
});
