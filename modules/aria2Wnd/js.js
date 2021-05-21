addEventListener('message', (event) => {
    printGlobalOptions();
    document.querySelector('#aria2Ver').innerText = event.data;
});

document.querySelector('#aria2Exit').addEventListener('click', (event) => {
    parent.document.querySelector('#aria2Global').remove();
});

document.querySelectorAll('[aria2]').forEach(aria2 => {
    aria2.addEventListener('change', (event) => {
        var options = {};
        options[aria2.id] = aria2.value;
        jsonRPCRequest({method: 'aria2.changeGlobalOption', options}, printGlobalOptions);
    });
});

function printGlobalOptions() {
    jsonRPCRequest(
        {method: 'aria2.getGlobalOption'},
        (options) => {
            document.querySelectorAll('[aria2]').forEach(aria2 => {
                aria2.value = options[aria2.id] || aria2.getAttribute('aria2');
                var caution = aria2.getAttribute('caution');
                if (caution) {
                    document.getElementById(caution).innerText = bytesToFileSize(options[aria2.id]);
                }
            });
        }
    );
}
