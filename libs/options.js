function parseValueToOption(option, data) {
    if (option.hasAttribute('calc')) {
        var calc = bytesToFileSize(data[option.id]);
        option.value = calc.slice(0, calc.indexOf(' ')) + calc.slice(calc.indexOf(' ') + 1, -1);
    }
    else {
        option.value = data[option.id] || '';
    }
}

function printGlobalOption() {
    browser.runtime.sendMessage({jsonrpc: true}, aria2RPC => {
        document.querySelectorAll('[aria2]').forEach(aria2 => parseValueToOption(aria2, aria2RPC.globalOption));
    });
}

function changeGlobalOption(name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeGlobalOption', options}, printGlobalOption);
}

function printTaskOption(gid) {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            document.querySelectorAll('[task]').forEach(task => parseValueToOption(task, options));
        }
    );
}

function changeTaskOption(gid, name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest(
        {method: 'aria2.changeOption', gid, options},
        (result) => {
            printTaskOption(gid);
        }
    );
}

document.querySelectorAll('[load]').forEach(load => {
    load.addEventListener('click', (event) => {
        document.getElementById(load.getAttribute('load')).value = localStorage[load.id];
    });
});
