document.querySelectorAll('div[card]').forEach((card, index, array) => {
    var wheel = 0;
    var limit = array.length - 1;
    card.style.display = index === 0 ? 'block' : 'none';
    card.addEventListener('wheel', (event) => {
        if (event.deltaY > 0) {
            wheel = wheel >= 0 ? wheel + 1 : 1;
            toggleCardView(wheel === 3 && index !== limit, index + 1);
        }
        else {
            wheel = wheel <= 0 ? wheel - 1 : -1;
            toggleCardView(wheel === -3 && index !== 0, index - 1);
        }
    }, {passive: true});

    function toggleCardView(condition, view) {
        if (condition) {
            card.style.display = 'none';
            array[view].style.display = 'block';
            wheel = 0;
        }
    }
});
