var menuTabs = [
    {button: 'tabBasic', queue: 'menuBasic'},
    {button: 'tabAdvanced', queue: 'menuAdvanced'},
    {button: 'tabDownload', queue: 'menuDownload'}
];
menuTabs.forEach(active => {
    document.getElementById(active.button).addEventListener('click', (event) => {
        document.getElementById(active.button).classList.add('checked');
        document.getElementById(active.queue).style.display = 'block';
        menuTabs.forEach(item => { if (item.queue !== active.queue) {document.getElementById(item.queue).style.display = 'none'; document.getElementById(item.button).classList.remove('checked');} });
    });
});

[
    {id: 'jsonrpc', value: 'http://localhost:6800/jsonrpc'},
    {id: 'token', value: ''},
    {id: 'folder', value: 0, change: downloadFolder, onload: downloadFolder},
    {id: 'directory', value: ''},
    {id: 'useragent', value: navigator.userAgent},
    {id: 'allproxy', value: ''},
    {id: 'proxied', value: ''},
    {id: 'capture', value: 0, change: captureFilters, onload: captureFilters},
    {id: 'sizeEntry', value: 0, change: calcFileSize},
    {id: 'sizeUnit', value: 2, change: calcFileSize},
    {id: 'fileExt', value: ''},
    {id: 'monitored', value: ''},
    {id: 'ignored', value: ''}
].forEach(property => {
    var menu = document.getElementById(property.id);
    if (property.change) {
        menu.addEventListener('change', property.change);
    }
    if (property.checkbox) {
        menu.setAttribute('checked', JSON.parse(localStorage.getItem(property.id)) || property.value);
        menu.addEventListener('change', (event) => localStorage.setItem(property.id, event.target.checked));
    }
    else {
        menu.value = localStorage.getItem(property.id) || property.value;
        menu.addEventListener('change', (event) => localStorage.setItem(property.id, event.target.value));
    }
    if (typeof property.onload === 'function') {
        property.onload();
    }
});

document.getElementById('aria2Check').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.getVersion'},
        (result) => {
            showNotification(browser.i18n.getMessage('warn_aria2_version'), result.version);
        },
        (error, rpc) => {
            showNotification(error, rpc);
        }
    );
});

document.getElementById('aria2Show').addEventListener('click', (event) => {
    if (event.target.classList.contains('checked')) {
        document.getElementById('token').setAttribute('type', 'password');
    }
    else {
        document.getElementById('token').setAttribute('type', 'text');
    }
    event.target.classList.toggle('checked');
});

function downloadFolder() {
    var folder = document.getElementById('folder').value | 0;
    if (folder === 2) {
        document.getElementById('directory').style.display = 'block';
    }
    else {
        document.getElementById('directory').style.display = 'none';
    }
}

function captureFilters() {
    var capture = document.getElementById('capture').value | 0;
    if (capture === 1) {
        document.getElementById('captureFilters').style.display = 'block';
    }
    else {
        document.getElementById('captureFilters').style.display = 'none';
    }
}

function calcFileSize(event) {
    var number = document.getElementById('sizeEntry').value | 0;
    var unit = document.getElementById('sizeUnit').value | 0;
    var size = number * Math.pow(1024, unit);
    localStorage.setItem('fileSize', size);
}

document.getElementById('sizeEntry').disabled = true;
document.getElementById('sizeUnit').disabled = true;
