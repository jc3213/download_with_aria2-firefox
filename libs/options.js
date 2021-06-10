function applyValueToOptions(option, data) {
    if (option.hasAttribute('calc')) {
        var calc = bytesToFileSize(data[option.id]);
        option.value = calc.slice(0, calc.indexOf(' ')) + calc.slice(calc.indexOf(' ') + 1, -1);
    }
    else {
        option.value = data[option.id] || '';
    }
}

function printGlobalOptions() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalOption'},
        (global) => {
            document.querySelectorAll('[aria2]').forEach(aria2 => applyValueToOptions(aria2, global));
        }
    );
}

function changeGlobalOption(name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeGlobalOption', options}, printGlobalOptions);
}

function printTaskOptions(gid) {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            document.querySelectorAll('[task]').forEach(task => applyValueToOptions(task, options));
        }
    );
}

function changeTaskOption(gid, name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest(
        {method: 'aria2.changeOption', gid, options},
        (result) => {
            printTaskOptions(gid);
        }
    );
}

document.querySelectorAll('[load]').forEach(load => {
    load.addEventListener('click', (event) => {
        document.getElementById(load.getAttribute('load')).value = localStorage[load.id];
    });
});
