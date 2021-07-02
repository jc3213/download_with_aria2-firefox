document.querySelector('#manager').style.display = location.search === '?popup' ? 'none' : 'block';

document.querySelector('#export').addEventListener('click', (event) => {
    var blob = new Blob([JSON.stringify(aria2RPC)], {type: 'application/json; charset=utf-8'});
    var saver = document.createElement('a');
    saver.href = URL.createObjectURL(blob);
    saver.download = 'downwitharia2_options-' + new Date().toLocaleString('ja').replace(/[\/\s:]/g, '_') + '.json';
    saver.click();
});

document.querySelector('#import').addEventListener('click', (event) => {
    var file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json';
    file.click();
    file.addEventListener('change', (event) => {
        var reader = new FileReader();
        reader.readAsText(event.target.files[0]);
        reader.onload = () => {
            var json = JSON.parse(reader.result);
            chrome.storage.local.set(json);
            location.reload();
        };
    });
});

document.querySelector('#aria2_btn').addEventListener('click', (event) => {
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.getVersion', params: [aria2RPC.jsonrpc['token']]},
    version => openModuleWindow('aria2Wnd', '/modules/aria2Wnd/index.html?' + version.version),
    error => showNotification(error));
});

document.querySelector('#show_btn').addEventListener('click', (event) => {
    document.querySelector('#token').setAttribute('type', event.target.className === 'checked' ? 'password' : 'text');
    event.target.classList.toggle('checked');
});

aria2RPCLoader(() => {
    document.querySelectorAll('input, select, textarea').forEach(field => {
        var root = field.getAttribute('root');
        var tree = root ? aria2RPC[root] : aria2RPC;
        var value = root ? tree[field.id] : tree[field.id];
        var token = field.getAttribute('token');
        var multi = field.getAttribute('multi');
        field.value = token ? value.slice(token.length) : multi ? value / multi : value;
        field.addEventListener('change', (event) => {
            tree[field.id] = Array.isArray(value) ? field.value.split(/[\s\n,]/) :
                token ? 'token:' + field.value : multi ? field.value * multi : field.value;
            chrome.storage.local.set(aria2RPC);
        });
    });
    document.querySelectorAll('[gear]').forEach(gear => {
        var rule = gear.getAttribute('gear').split('&');
        var name = rule[0].split(','), term = rule[1];
        var id = name[0], root = name[1];
        var tree = root ? aria2RPC[root] : aria2RPC;
        var field = root ? '#' + id + '[root="' + root + '"]' : '#' + id;
        gear.style.display = term.includes(tree[id]) ? 'block' : 'none';
        document.querySelector(field).addEventListener('change', (event) => {
            gear.style.display = term.includes(tree[id]) ? 'block' : 'none';
        });
    });
});
