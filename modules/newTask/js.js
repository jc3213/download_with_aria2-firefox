document.querySelector('#submit_btn').addEventListener('click', (event) => {
    var referer = document.querySelector('#referer').value;
    var options = {};
    document.querySelectorAll('[option], [aria2]').forEach(option => {
        options[option.id] = option.value;
    });
    document.querySelector('#entries').value.split('\n').forEach(url => {
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
    parent.document.getElementById(frameElement.id).style.display = 'none';
    parent.document.querySelector('[module="' + frameElement.id + '"]').classList.remove('checked');
    setTimeout(() => {
        parent.document.getElementById(frameElement.id).remove();
    }, 1000);
});

printGlobalOptions();
