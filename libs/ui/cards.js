document.querySelectorAll('[card]').forEach((card, index, cards) => {
    var wheel = 0;
    var view = -1;
    var limit = cards.length - 1;
    card.style.display = index === 0 ? 'block' : 'none';
    card.addEventListener('wheel', (event) => {
        if (event.deltaY > 0) {
            wheel = wheel < 0 ? 0 : card.scrollHeight - card.scrollTop === card.clientHeight ? wheel + 1 : 0;
            view = wheel === 3 && index !== limit ? index + 1 : -1;
        }
        else {
            wheel = wheel > 0 ? 0 : card.scrollTop === 0 ? wheel - 1 : 0;
            view = wheel === -3 && index !== 0 ? index - 1 : -1;
        }
        if (view !== -1) {
            card.style.display = 'none';
            cards[view].style.display = 'block';
            wheel = 0;
            view = -1;
        }
    }, {passive: true});
});
