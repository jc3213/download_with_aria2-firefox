document.querySelectorAll('[tab]').forEach((tab, index) => {
    var name = tab.getAttribute('tab');
    if (index === 0) {
        tab.className = 'checked';
        activeTab = name;
    }
    tab.addEventListener('click', (event) => {
        if (tab.className !== 'checkd' && name !== activeTab) {
            document.querySelector('[tab="' + name + '"]').className = 'checked';
            document.querySelector('[panel="' + name + '"]').style.display = 'block';
            document.querySelector('[tab="' + activeTab + '"]').className = '';
            document.querySelector('[panel="' + activeTab + '"]').style.display = 'none';
            activeTab = name;
        }
    });
});

document.querySelectorAll('[panel]').forEach((panel, index) => {
    panel.style.display = index === 0 ? 'block' : 'none';
});
