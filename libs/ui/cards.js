document.querySelectorAll('[card]').forEach((card, index, cards) => {
    var wheel = 0;
    var limit = cards.length - 1;
    card.style.display = index === 0 ? 'block' : 'none';
    card.addEventListener('wheel', (event) => {
        if (event.deltaY > 0) {
            wheel = card.scrollHeight - card.scrollTop === card.clientHeight ? wheel + 1 : 0;
            toggleCardView(wheel === 3 && index !== limit, index + 1);
        }
        else {
            wheel = card.scrollTop === 0 ? wheel - 1 : 0;
            toggleCardView(wheel === -3 && index !== 0, index - 1);
        }
    }, {passive: true});

    function toggleCardView(condition, view) {
        if (condition) {
            card.style.display = 'none';
            cards[view].style.display = 'block';
            wheel = 0;
        }
    }
});
