document.querySelectorAll('[tab]').forEach((tab, index) => {
    var active = tab.getAttribute('tab');
    tab.className = index === 0 ? 'checked' : '';
    tab.addEventListener('click', (event) => {
        if (!tab.classList.contains('checkd')) {
            document.querySelectorAll('[panel]').forEach(panel => {
                var id = panel.getAttribute('panel');
                if (id === active) {
                    tab.className = 'checked';
                    panel.style.display = 'block';
                }
                else {
                    panel.style.display = 'none';
                    document.querySelector('[tab="' + id + '"]').removeAttribute('class');
                }
            });
        }
    });
});

document.querySelectorAll('[panel]').forEach((panel, index) => {
    panel.style.display = index === 0 ? 'block' : 'none';
});
