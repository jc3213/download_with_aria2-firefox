document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (event) => {
        document.querySelectorAll('[tab]').forEach(body => {
            var id = body.getAttribute('tab');
            if (id === tab.id) {
                tab.classList.add('checked');
                body.style.display = 'block';
            }
            else {
                body.style.display = 'none';
                document.getElementById(id).classList.remove('checked');
            }
        });
    });
});
