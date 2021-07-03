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
            browser.storage.local.set(json);
            location.reload();
        };
    });
});

document.querySelector('#show_btn').addEventListener('click', (event) => {
    document.querySelector('#token').setAttribute('type', event.target.className === 'checked' ? 'password' : 'text');
    event.target.classList.toggle('checked');
});

document.querySelector('#back_btn').addEventListener('click', (event) => {
    document.querySelector('[module="local"]').style.display = 'block';
    document.querySelector('[module="global"]').style.display = 'none';
});

document.querySelector('#aria2_btn').addEventListener('click', (event) => {
    aria2RPCRequest([
        {id: '', jsonrpc: 2, method: 'aria2.getVersion', params: [aria2RPC.jsonrpc['token']]},
        {id: '', jsonrpc: 2, method: 'aria2.getGlobalOption', params: [aria2RPC.jsonrpc['token']]}
    ],
    (version, options) => {
        aria2Global = options;
        document.querySelector('[module="local"]').style.display = 'none';
        document.querySelector('[module="global"]').style.display = 'block';
        document.querySelector('#version').innerText = version.version;
        document.querySelectorAll('[aria2]').forEach(field => {
            var name = field.getAttribute('aria2');
            var calc = field.hasAttribute('calc') ? bytesToFileSize(aria2Global[name]) : null;
            field.value = calc ? calc.slice(0, calc.indexOf(' ')) + calc.slice(calc.indexOf(' ') + 1, -1) : aria2Global[name] ?? '';
        });
    },
    error => showNotification(error));
});

document.querySelector('[module="global"]').addEventListener('change', (event) => {
    var name = event.target.getAttribute('aria2');
    aria2Global[name] = event.target.value;
    aria2RPCRequest({id: '', jsonrpc: 2, method: 'aria2.changeGlobalOption', params: [aria2RPC.jsonrpc['token'], aria2Global]});
});

aria2RPCLoader(() => {
    document.querySelectorAll('[local]').forEach(field => {
        var name = field.getAttribute('local');
        var root = field.getAttribute('root');
        root ? {[root]: {[name] : value}} = aria2RPC : {[name] : value} = aria2RPC;
        var token = field.getAttribute('token');
        var multi = field.getAttribute('multi');
        field.value = token ? value.slice(token.length) : multi ? value / multi : value;
        field.addEventListener('change', (event) => {
            var value = Array.isArray(value) ? field.value.split(/[\s\n,]/) :
                token ? 'token:' + field.value : multi ? field.value * multi : field.value;
            root ? aria2RPC[root][name] = value : aria2RPC[name] = value;
            browser.storage.local.set(aria2RPC);
        });
    });
    document.querySelectorAll('[gear]').forEach(gear => {
        var rule = gear.getAttribute('gear').split('&');
        var gate = rule[0].split(','), term = rule[1];
        var name = gate[0], root = gate[1];
        var tree = root ? aria2RPC[root] : aria2RPC;
        var field = root ? '[local="' + name + '"][root="' + root + '"]' : '[local="' + name + '"]';
        gear.style.display = term.includes(tree[name]) ? 'block' : 'none';
        document.querySelector(field).addEventListener('change', (event) => {
            gear.style.display = term.includes(tree[name]) ? 'block' : 'none';
        });
    });
});
