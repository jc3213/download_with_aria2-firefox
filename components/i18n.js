document.querySelectorAll('[i18n]').forEach(item => item.innerHTML = browser.i18n.getMessage(item.innerHTML));

document.querySelectorAll('[i18n_title]').forEach(item => item.title = browser.i18n.getMessage(item.title));
