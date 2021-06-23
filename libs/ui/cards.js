var cards = document.querySelectorAll('[card]');
var cardCurrent = 0;
var cardNext = 0;
var cardLimit = cards.length - 1;
var wheelScroll = 0;

cards.forEach((card, index) => {
    card.style.display = index === cardCurrent ? 'block' : 'none';
    card.addEventListener('wheel', (event) => {
        if (event.deltaY > 0) {
            wheelScroll = wheelScroll < 0 ? 0 : card.scrollHeight - card.scrollTop === card.clientHeight ? wheelScroll + 1 : 0;
            cardNext = wheelScroll === 3 && index !== cardLimit ? index + 1 : index;
        }
        else {
            wheelScroll = wheelScroll > 0 ? 0 : card.scrollTop === 0 ? wheelScroll - 1 : 0;
            cardNext = wheelScroll === -3 && index !== 0 ? index - 1 : index;
        }
        if (cardCurrent !== cardNext) {
            switchCardView();
        }
    }, {passive: true});
});

document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'TEXTAREA') {
        return;
    }
    if (event.key === 'PageDown') {
        cardNext = cardCurrent !== cardLimit ? cardCurrent + 1 : cardCurrent;
        switchCardView();
    }
    if (event.key === 'PageUp') {
        cardNext = cardCurrent !== 0 ? cardCurrent - 1 : cardCurrent;
        switchCardView();
    }
});

function switchCardView() {
    cards[cardCurrent].style.display = 'none';
    cards[cardNext].style.display = 'block';
    cardCurrent = cardNext;
    wheelScroll = 0;
}
