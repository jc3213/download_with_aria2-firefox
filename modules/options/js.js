document.querySelector('#manager').style.display = location.search === '?from=popup' ? 'none' : 'block';

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
        var options = JSON.parse(reader.result);
        Object.keys(options).forEach(key => {
            localStorage[key] = options[key];
        });
        location.reload();
    };
});

document.querySelectorAll('[local]').forEach(option => {
    option.value = localStorage[option.id];
    option.addEventListener('change', (event) => {
        localStorage[option.id] = option.value;
    });
});

document.querySelector('#aria2_btn').addEventListener('click', (event) => {
    jsonRPCRequest(
        {method: 'aria2.getVersion'},
        (result) => {
            openModuleWindow('aria2Wnd', '/modules/aria2Wnd/index.html?version=' + result.version);
        },
        (error, rpc) => {
            showNotification(error, rpc);
        }
    );
});

document.querySelector('#show_btn').addEventListener('click', (event) => {
    document.querySelector('#token').setAttribute('type', event.target.classList.contains('checked') ? 'password' : 'text');
    event.target.classList.toggle('checked');
});

document.querySelectorAll('[gear]').forEach(gear => {
    var setting = gear.getAttribute('gear').split('&');
    var id = setting.shift();
    gear.style.display = setting.includes(localStorage[id]) ? 'block' : 'none';
    document.getElementById(id).addEventListener('change', (event) => {
        gear.style.display = setting.includes(localStorage[id]) ? 'block' : 'none';
    });
});

document.querySelector('#sizeEntry').addEventListener('change', calcFileSize);

document.querySelector('#sizeUnit').addEventListener('change', calcFileSize);

function calcFileSize() {
    var number = localStorage['sizeEntry'] | 0;
    var unit = localStorage['sizeUnit'] | 0;
    localStorage['fileSize'] = number * 1024 ** unit;
}
