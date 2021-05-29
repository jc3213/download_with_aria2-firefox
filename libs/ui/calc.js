function bytesToFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    }
    else if (bytes >= 1024 && bytes < 1048576) {
        return (bytes / 10.24 | 0) / 100 + ' KB';
    }
    else if (bytes >= 1048576 && bytes < 1073741824) {
        return (bytes / 10485.76 | 0) / 100 + ' MB';
    }
    else if (bytes >= 1073741824 && bytes < 1099511627776) {
        return (bytes / 10737418.24 | 0) / 100 + ' GB';
    }
    else if (bytes >= 1099511627776) {
        return (bytes / 10995116277.76 | 0) / 100 + ' TB';
    }
}

function numberToTimeFormat(number) {
    if (isNaN(number) || number === Infinity) {
        return '∞';
    }
    var days = number / 86400 | 0;
    var hours = number / 3600 - days * 24 | 0;
    var minutes = number / 60 - days * 1440 - hours * 60 | 0;
    var seconds = number - days * 86400 - hours * 3600 - minutes * 60 | 0;
    return (days > 0 ? days + '<sub>d</sub>' : '')
    +      (hours > 0 ? hours + '<sub>h</sub>' : '')
    +      (minutes > 0 ? minutes + '<sub>m</sub>' : '')
    +      seconds + '<sub>s</sub>';
}
