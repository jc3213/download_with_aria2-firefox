document.querySelector('#version').innerText = location.search.slice(1);

document.querySelector('#back_btn').addEventListener('click', (event) => {
    parent.document.getElementById(frameElement.id).remove();
});

document.querySelectorAll('[aria2]').forEach(aria2 => {
    aria2.addEventListener('change', (event) => {
        changeGlobalOption(aria2.id, aria2.value);
    });
});

printGlobalOption();
