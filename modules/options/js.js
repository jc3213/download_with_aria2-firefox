var menuTabs = [
    {button: 'tabBasic', queue: 'menuBasic'},
    {button: 'tabAdvanced', queue: 'menuAdvanced'},
    {button: 'tabDownload', queue: 'menuDownload'}
];
menuTabs.forEach(active => {
    document.getElementById(active.button).addEventListener('click', (event) => {
        document.getElementById(active.button).classList.add('checked');
        document.getElementById(active.queue).style.display = 'block';
        menuTabs.forEach(item => {
            if (item.queue !== active.queue) {
                document.getElementById(item.queue).style.display = 'none';
                document.getElementById(item.button).classList.remove('checked');
            }
        });
    });
});

document.querySelector('#export').addEventListener('click', (event) => {
    var blob = new Blob([JSON.stringify(localStorage)], {type: 'application/json; charset=utf-8'});
    var saver = document.querySelector('#saver');
    saver.href = URL.createObjectURL(blob);
    saver.download = 'downwitharia2_options-' + new Date().toLocaleString('ja').replace(/[\/\s:]/g, '_') + '.json';
    saver.click();
});

document.querySelector('#import').addEventListener('click', (event) => {
    document.querySelector('#reader').click();
});

document.querySelector('#reader').addEventListener('change', (event) => {
    var reader = new FileReader();
    reader.readAsText(event.target.files[0]);
    reader.onload = () => {
        restoreSettings(reader.result, false);
        location.reload();
    };
});

[
    'jsonrpc',
    'token',
    'output',
    'folder',
    'useragent',
    'allproxy',
    'proxied',
    'capture',
    'sizeEntry',
    'sizeUnit',
    'fileExt',
    'monitored',
    'ignored'
].forEach(id => {
    var menu = document.getElementById(id);
    menu.value = localStorage[id];
    menu.addEventListener('change', (event) => {
        localStorage[id] = event.target.value;
    });
});

document.querySelector('#verify').addEventListener('click', (event) => {
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

document.querySelector('#insight').addEventListener('click', (event) => {
    document.querySelector('#token').setAttribute('type', event.target.classList.contains('checked') ? 'password' : 'text');
    event.target.classList.toggle('checked');
});

document.querySelector('#output').addEventListener('change', downloadFolder);
downloadFolder();

document.querySelector('#capture').addEventListener('change', captureFilters);
captureFilters();

document.querySelector('#sizeEntry').addEventListener('change', calcFileSize);

document.querySelector('#sizeUnit').addEventListener('change', calcFileSize);

function downloadFolder() {
    document.getElementById('folder').style.display = localStorage['output'] === '2' ? 'block' : 'none';
}

function captureFilters() {
    document.querySelector('#captureFilters').style.display = localStorage['capture'] === '1' ? 'block' : 'none';
    document.querySelector('#captureIgnored').style.display = localStorage['capture'] !== '0' ? 'block' : 'none';
}

function calcFileSize() {
    var number = localStorage['sizeEntry'] | 0;
    var unit = localStorage['sizeUnit'] | 0;
    localStorage['fileSize'] = number * 1024 ** unit;
}

document.getElementById('sizeEntry').disabled = true;
document.getElementById('sizeUnit').disabled = true;
