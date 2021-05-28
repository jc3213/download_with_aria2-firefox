document.querySelector('#card_btn').addEventListener('click', (event) => {
    event.target.classList.toggle('checked');
    document.querySelectorAll('div[card]').forEach(body => {
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
    });
});
