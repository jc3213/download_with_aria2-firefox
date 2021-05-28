document.querySelectorAll('span.tab').forEach(tab => {
    tab.addEventListener('click', (event) => {
        document.querySelectorAll('div[tab]').forEach(body => {
            var tabId = body.getAttribute('tab');
            if (tabId === tab.id) {
                tab.classList.add('checked');
                body.style.display = 'block';
            }
            else {
                body.style.display = 'none';
                document.getElementById(tabId).classList.remove('checked');
            }
        });
    });
});
