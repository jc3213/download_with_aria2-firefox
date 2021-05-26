function printGlobalOptions() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalOption'},
        (global) => {
            document.querySelectorAll('[aria2]').forEach(aria2 => {
                aria2.value = aria2.hasAttribute('size') ? bytesToFileSize(global[aria2.id]).slice(0, -1).replace(' ', '') : global[aria2.id] || '';
            });
        }
    );
}

function changeGlobalOptions(name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest({method: 'aria2.changeGlobalOption', options}, printGlobalOptions);
}

function printTaskOptions(gid) {
    jsonRPCRequest(
        {method: 'aria2.getOption', gid},
        (options) => {
            document.querySelectorAll('[task]').forEach(task => {
                task.value = task.hasAttribute('size') ? bytesToFileSize(options[task.id]).slice(0, -1).replace(' ', '') : options[task.id] || '';
            });
        }
    );
}

function changeTaskOptions(gid, name, value, options = {}) {
    options[name] = value;
    jsonRPCRequest(
        {method: 'aria2.changeOption', gid, options},
        (result) => {
            printTaskOptions(gid);
        }
    );
}
