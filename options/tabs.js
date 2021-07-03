var activeTab = {local: 'basic', global: 'http'};
handleTabEvent('local');
handleTabEvent('global');

function handleTabEvent(root) {
    var tabs = document.querySelectorAll('[module="' + root + '"] [tab]');
    var panels = document.querySelectorAll('[module="' + root + '"] [panel]');

    tabs.forEach(tab => {
        var name = tab.getAttribute('tab');
        tab.className = activeTab[root] === name ? 'checked' : '';
        tab.addEventListener('click', (event) => {
            if (tab.className !== 'checked') {
                tab.className = 'checked';
                document.querySelector('[module="' + root + '"] [tab="' + activeTab[root] + '"]').className = '';
                document.querySelector('[module="' + root + '"] [panel="' + name + '"]').style.display = 'block';
                document.querySelector('[module="' + root + '"] [panel="' + activeTab[root] + '"]').style.display = 'none';
                activeTab[root] = name;
            }
        });
    });
    panels.forEach(panel => {
        panel.style.display = activeTab[root] === panel.getAttribute('panel') ? 'block' : 'none';
    });
}
