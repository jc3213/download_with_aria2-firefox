document.querySelectorAll('[tab]').forEach((tab, index) => {
    var active = tab.getAttribute('tab');
    tab.className = index === 0 ? 'checked' : '';
    tab.addEventListener('click', (event) => {
        if (!tab.classList.contains('checkd')) {
            document.querySelectorAll('[panel]').forEach(panel => {
                var name = panel.getAttribute('panel');
                if (name === active) {
                    tab.className = 'checked';
                    panel.style.display = 'block';
                }
                else {
                    panel.style.display = 'none';
                    document.querySelector('[tab="' + name + '"]').removeAttribute('class');
                }
            });
        }
    });
});

document.querySelectorAll('[panel]').forEach((panel, index) => {
    panel.style.display = index === 0 ? 'block' : 'none';
});
