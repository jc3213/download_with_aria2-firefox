var options = {};

document.querySelector('#version').innerText = location.search.slice(1);

document.querySelector('#back_btn').addEventListener('click', (event) => {
    frameElement.remove();
});

browser.runtime.sendMessage({jsonrpc: true}, aria2RPC => {
    document.querySelectorAll('[aria2]').forEach(aria2 => parseValueToOption(aria2, aria2RPC.globalOption));
});

document.addEventListener('change', (event) => {
    options[event.target.id] = event.target.value;
    jsonRPCRequest({method: 'aria2.changeGlobalOption', options});
});
