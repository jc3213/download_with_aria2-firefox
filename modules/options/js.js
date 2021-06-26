document.querySelector('#manager').style.display = location.search === '?popup' ? 'none' : 'block';

browser.storage.local.get(null, result => {
    aria2Option = result;
    document.querySelectorAll('input, select, textarea').forEach(field => {
        var gear = field.getAttribute('gear');
        var root = field.getAttribute('root');
        var tree = root ? aria2Option[root] : aria2Option;
        var value = root ? tree[field.id] : tree[field.id];
        var multi = field.getAttribute('multi');
        field.value = multi ? value / multi : value;
        field.addEventListener('change', (event) => {
            tree[field.id] = Array.isArray(value) ? field.value.split(/[\s\n,]/) : multi ? field.value * multi : field.value;
            browser.storage.local.set(aria2Option);
        });
    });
    document.querySelectorAll('[gear]').forEach(gear => {
        var rule = gear.getAttribute('gear').split('&');
        var name = rule[0].split(','), term = rule[1];
        var id = name[0], root = name[1];
        var tree = root ? aria2Option[root] : aria2Option;
        var field = root ? '#' + id + '[root="' + root + '"]' : '#' + id;
        gear.style.display = term.includes(tree[id]) ? 'block' : 'none';
        document.querySelector(field).addEventListener('change', (event) => {
            gear.style.display = term.includes(tree[id]) ? 'block' : 'none';
        });
    });
});

document.querySelector('#export').addEventListener('click', (event) => {
    var blob = new Blob([JSON.stringify(aria2Option)], {type: 'application/json; charset=utf-8'});
    var saver = document.createElement('a');
    saver.href = URL.createObjectURL(blob);
    saver.download = 'downwitharia2_options-' + new Date().toLocaleString('ja').replace(/[\/\s:]/g, '_') + '.json';
    saver.click();
    saver.remove();
});

document.querySelector('#import').addEventListener('click', (event) => {
    var field = document.createElement('input');
    field.type = 'file';
    field.accept = 'application/json';
    field.addEventListener('change', (event) => {
        var reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        reader.onload = () => {
            var json = JSON.parse(reader.result);
            browser.storage.local.set(json);
            field.remove();
            location.reload();
        };
    })
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
