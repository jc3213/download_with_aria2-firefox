document.querySelector('#manager').style.display = location.search === '?popup' ? 'none' : 'block';

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

document.querySelectorAll('[local]').forEach(field => {
    var multi = field.getAttribute('multi');
    field.value = multi ? localStorage[field.id] / multi : localStorage[field.id];
    field.addEventListener('change', (event) => {
        localStorage[field.id] = multi ? field.value * multi : field.value;
    });
});

document.querySelector('#aria2_btn').addEventListener('click', (event) => {
    browser.runtime.sendMessage({jsonrpc: true}, aria2RPC => {
        var {version, error} = aria2RPC;
        if (version) {
            openModuleWindow('aria2Wnd', '/modules/aria2Wnd/index.html?' + version.version);
        }
        if (error) {
            showNotification(error);
        }
    });
});

document.querySelector('#show_btn').addEventListener('click', (event) => {
    document.querySelector('#token').setAttribute('type', event.target.className === 'checked' ? 'password' : 'text');
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
