addEventListener('message', (event) => {
    printGlobalOptions();
    document.querySelector('#aria2Ver').innerText = event.data;
    parent.document.body.style.height = document.body.offsetHeight + 'px';
});

document.querySelector('body > div.frame > div.container').addEventListener('click', (event) => {
    if (event.target.classList.contains('tab')) {
        parent.document.body.style.height = document.body.offsetHeight + 'px';
    }
});

document.querySelector('#aria2Exit').addEventListener('click', (event) => {
    parent.document.body.style.height = 'max-content';
    parent.document.querySelector('#aria2Global').remove();
});

document.querySelectorAll('[aria2]').forEach(aria2 => {
    aria2.addEventListener('change', (event) => {
        changeGlobalOptions(aria2.id, aria2.value);
    });
});
