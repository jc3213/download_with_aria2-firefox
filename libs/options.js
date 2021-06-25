function parseValueToOption(field, options) {
    if (field.hasAttribute('calc')) {
        var calc = bytesToFileSize(options[field.id]);
        field.value = calc.slice(0, calc.indexOf(' ')) + calc.slice(calc.indexOf(' ') + 1, -1);
    }
    else {
        field.value = options[field.id] || '';
    }
}

document.querySelectorAll('[load]').forEach(load => {
    load.addEventListener('click', (event) => {
        document.getElementById(load.getAttribute('load')).value = localStorage[load.id];
    });
});
