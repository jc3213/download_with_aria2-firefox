$('[i18n]').each((index, element) => {
    $(element).html(browser.i18n.getMessage(element.innerHTML));
});

$('[i18n_title]').each((index, element) => {
    $(element).attr('title', browser.i18n.getMessage(element.title));
});

[
    'warn_aria2_version', 'warn_url_copied'
].map(item => window[item] = browser.i18n.getMessage(item));
