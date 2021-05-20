function openModuleWindow(id, src, onload) {
    var iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = src;
    if (typeof onload === 'function') {
        iframe.addEventListener('load', onload);
    }
    document.body.appendChild(iframe);
}
