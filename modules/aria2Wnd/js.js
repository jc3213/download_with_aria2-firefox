addEventListener('message', (event) => {
    printGlobalOptions();
    document.querySelector('#aria2Ver').innerText = event.data;
});

document.querySelector('#back_btn').addEventListener('click', (event) => {
    parent.document.body.style.height = 'max-content';
    parent.document.querySelector('#aria2Global').remove();
});

document.querySelectorAll('[aria2]').forEach(aria2 => {
    aria2.addEventListener('change', (event) => {
        changeGlobalOption(aria2.id, aria2.value);
    });
});
