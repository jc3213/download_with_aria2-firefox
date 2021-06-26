function feedEventHandler() {
    document.querySelectorAll('[feed]').forEach(feed => {
        var field = feed.getAttribute('feed');
        var root = feed.getAttribute('root');
        var tree = root ? aria2RPC.option[root] : aria2RPC.option;
        feed.addEventListener('click', (event) => {
            document.getElementById(field).value = tree[feed.id];
        });
    });
}

function parseValueToOption(field, options) {
    if (field.hasAttribute('calc')) {
        var calc = bytesToFileSize(options[field.id]);
        field.value = calc.slice(0, calc.indexOf(' ')) + calc.slice(calc.indexOf(' ') + 1, -1);
    }
    else {
        field.value = options[field.id] ?? '';
    }
}
