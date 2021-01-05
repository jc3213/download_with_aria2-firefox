document.getElementById('taskProxy').value = localStorage['allproxy'];

document.getElementById('setProxy').addEventListener('click', (event) => {
    document.getElementById('taskProxy').disabled = !document.getElementById('taskProxy').disabled;
});

document.getElementById('submit_btn').addEventListener('click', (event) => {
    var referer = document.getElementById('taskReferer').value;
    var proxy = document.getElementById('setProxy').checked ? document.getElementById('taskProxy').value : '';
    var url = document.getElementById('taskBatch').value.split('\n').forEach(item => { if (item !== '') downWithAria2({url: item, referer: referer, options: {'all-proxy': proxy}}); });
    parent.window.postMessage({id: 'newTaskWindow', delay: 1000});
});
