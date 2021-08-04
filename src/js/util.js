// Fot the shell only

function hex(color) {
    return '#' + [color.red, color.green, color.blue].map(n => {
        return n.toString(16).padStart(2, '0');
    }).join('');
}

function renderFiglet(text, font) {
    return figlet.textSync(text, {
        font: 'Small'
    });
}

function fonts() {
    return new Promise(resolve => {
        figlet.defaults({fontPath: 'https://unpkg.com/figlet@1.4.0/fonts/'});
        var fonts = ['Small'];
        figlet.preloadFonts(fonts, resolve);
    });
}

function rand(max) {
    return Math.floor(Math.random() * (max + 1));
}

function render(fn, text) {
    var i = 20;
    var o = rand(256);
    function eachLine() {
      i -= 1;
      lolcat.options.seed = o + i;
    }
    return lolcat.format(fn, renderFiglet(text), eachLine).join('<br>').replaceAll('> ','>&nbsp;');
}

function renderTitle(title) {
    var styles = [];
    term.echo($(render(function(char, color) {
        return `<span style="color: ${hex(color)}">${char}</span>`;
    }, title)));
}


function isHex(h) {
    var a = parseInt(h,16);
    return (a.toString(16) === h)
}
