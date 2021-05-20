function openModuleWindow(id, src, onload) {
    var iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;
    if (typeof onload === 'function') {
        iframe.addEventListener('load', onload);
    }
    document.body.appendChild(iframe);
}

function closeModuleWindow(id, timeout) {
    document.getElementById(id).style.display = 'none';
    setTimeout(() => {
        document.getElementById(id).remove();
    }, timeout | 0);
    document.querySelectorAll('span[module]').forEach(button => {
        if (button.getAttribute('module') === id) {
            console.log(button)
            button.classList.remove('checked');
        }
    });
}
