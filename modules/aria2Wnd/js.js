document.querySelector('#version').innerText = location.search.slice(1);

document.querySelector('#back_btn').addEventListener('click', (event) => {
    frameElement.remove();
});

browser.runtime.sendMessage({jsonrpc: true}, response => {
    aria2RPC = response;
    document.querySelectorAll('[aria2]').forEach(aria2 => {
        parseValueToOption(aria2, aria2RPC.globalOption);
    });
});

document.addEventListener('change', (event) => {
    aria2RPC.globalOption[event.target.id] = event.target.value;
    browser.runtime.sendMessage({request: {id: '', jsonrpc: 2, method: 'aria2.changeGlobalOption', params: [aria2RPC.options.jsonrpc['token'], aria2RPC.globalOption]}});
});
