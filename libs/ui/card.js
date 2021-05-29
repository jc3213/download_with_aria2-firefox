document.querySelectorAll('div[card]').forEach((card, index, array) => {
    var wheel = 0;
    var limit = array.length - 1;
    card.style.display = index === 0 ? 'block' : 'none';
    card.addEventListener('wheel', (event) => {
        if (event.deltaY > 0) {
            if (wheel >= 0) {
                wheel ++;
            }
            else {
                wheel = 1;
            }
            toggleCardView(wheel === 3 && index !== limit, index + 1);
        }
        else {
            if (wheel <= 0) {
                wheel --;
            }
            else {
                wheel = -1;
            }
            toggleCardView(wheel === -3 && index !== 0, index - 1);
        }
    });

    function toggleCardView(condition, view) {
        if (condition) {
            card.style.display = 'none';
            array[view].style.display = 'block';
            wheel = 0;
        }
    }
});
