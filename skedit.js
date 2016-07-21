const {remote,webFrame} = require('electron');
const yml = require('js-yaml');
const fs = require('fs');
const $ = require('jquery');
let win = remote.getGlobal('windows').mainWindow;
win.hide();
webFrame.setZoomLevelLimits(1, 1);
let lang;
try {
  lang = yml.safeLoad(fs.readFileSync(__dirname + '/' + remote.getGlobal('lang') + '.yml'));
} catch(e) {
  console.error('[ ! ] Error loading language file "' + remote.getGlobal('lang') + '.yml"')
}

let elmcount = 0;
let elmlangnum = 0;
$(document).on('langify', '*', (e) => {
  if(typeof $(e.target).text() !== undefined) {
    let l = lang;
    try {
      for(let s of $(e.target).text().split('.')) {
        l = l[s];
      }
      if(typeof l !== undefined) {
        $(e.target).text(l);
      }
    } catch(x) {}
  }
  if(typeof $(e.target).attr('title') !== undefined) {
    let l = lang;
    try {
      for(let s of $(e.target).attr('title').split('.')) {
        l = l[s];
      }
      if(typeof l !== undefined) {
        $(e.target).attr('title', l);
      }
    } catch(x) {}
  }
  $(e.target).off('langify');
  elmlangnum++;
  if(elmlangnum===elmcount){
    win.show();
  }
});

$(document).ready(() => {
  elmcount = $("*").length;
  $('*').trigger('langify');
  selectTab('Effs');
});

$(document).on('click', '.tab', (e) => {
  selectTab($(e.target).attr('id').substring(4,$(e.target).attr('id').length));
})

$(document).on('dragover',function(e){
  e.preventDefault();
});

$(document).on('drop',function(e){
  e.preventDefault();
});

let sTab = '';
function selectTab(t) {
  if(sTab !== '') {
    $('#pTab'+sTab).removeClass('selected');
  }
  $('#pTab'+t).addClass('selected');
  sTab = t;
  $('#paletteBody').html('');
  let name;
  switch(sTab) {
    case 'Evts':
      name = 'event';
      break;
    case 'Ctrls':
      name = 'control';
      break;
    case 'Effs':
      name = 'effect';
      break;
    case 'Conds':
      name = 'condition';
      break;
    case 'Ops':
      name = 'operation';
      break;
    case 'Exprs':
      name = 'expression';
      break;
  }
  for(let i in lang.block[name]){
    let d = document.createElement('DIV');
    $(d).html(blockParser(lang.block[name][i])).addClass('block').addClass(name).attr('pname', i);
    $('#paletteBody').append(d);
  }
  $('#paletteBody div.block').on('mousedown', blockDrag);
}

function blockDrag(evt) {
  if (evt.target !== evt.currentTarget) {
    return;
  }
  let box = $(evt.currentTarget).offset();
  let orX = (evt.pageX-Math.abs(box.left));
  let orY = (evt.pageY-Math.abs(box.top));
  let scX = $('#paletteBody').scrollLeft();
  let scY = $('#paletteBody').scrollTop();
  let copy;
  if($(evt.currentTarget).parent().attr('id') === 'paletteBody'){
    copy = $(evt.currentTarget).clone().css('left', -box.left).css('top', -box.top);
  } else if($(evt.currentTarget).parent().hasClass('blocksInput')) {
    copy = $(evt.currentTarget).css('left', -box.left).css('top', -box.top);
  } else {
    copy = $(evt.currentTarget)
    .css('left',parseInt($(evt.currentTarget)
    .css('left'))+$('#palette').outerWidth(true)+$('#togglePalette').outerWidth(true)+$('#program').outerWidth(true)-$('#program').width()-$('#program').scrollLeft())
    .css('top', parseInt($(evt.currentTarget)
    .css('top'))-$('#program').scrollTop());
  }
  copy.css('cursor', '-webkit-grabbing');
  $('#paletteBody').on('scroll', (e) => {
    $(e.target).scrollLeft(scX);
    $(e.target).scrollTop(scY);
  });
  copy.css('position', 'absolute');
  $('body').append(copy);
  $(document).on('mousemove', (e) => {
    let target;
    $('#program div.block .blocksInput').each(function() {
      let rect = this.getBoundingClientRect();
      if(e.pageX >= rect.left
        && e.pageX <= rect.right
        && e.pageY >= rect.top
        && e.pageY <= rect.bottom) {
          target = this;
      }
    });
    if(target!==undefined) {
      let thing;
      $(target).children().each(function(){
        if(this.getBoundingClientRect().bottom-$(this).height()/2 < e.pageY){
          thing = this;
        }
      })
      copy.css('left', undefined).css('top', undefined).css('position','static');
      if(thing===undefined){
        $(target).prepend(copy);
      } else {
        $(thing).after(copy);
      }
    } else {
      if(!copy.parent().is('body')) {
        copy.css('position','absolute');
        $('body').append(copy);
      }
      copy.css('left', e.pageX-orX).css('top', e.pageY-orY);
    }
  });
  $(document).on('mouseup', (e) => {
    $('#paletteBody').off('scroll');
    $(document).off('mouseup');
    $(document).off('mousemove');
    copy.css('cursor', '-webkit-grab');
    if(copy.parent().hasClass('blocksInput')) {
      copy.on('mousedown',blockDrag);
    } else if((e.pageX >= $('#palette').outerWidth(true) + $('#togglePalette').outerWidth(true))) {
      let dspx = e.pageX-orX-$('#palette').outerWidth(true)- $('#togglePalette').outerWidth(true)-$('#program').outerWidth(true)+ $('#program').width()+5+$("#program").scrollLeft();
      let dspy = e.pageY-orY+$("#program").scrollTop()-10;

      if($('#program').scrollLeft()+dspx < 0){
        $('#program *').css('left', function() {
          return (parseInt($(this).css('left'))-dspx);
        });
        $('#program').scrollLeft($('#program').scrollLeft()-dspx);
        dspx = 0;
      }
      if($('#program').scrollTop()+dspy < 0){
        $('#program *').css('top', function() {
          return (parseInt($(this).css('top'))-dspy);
        });
        $('#program').scrollTop($('#program').scrollTop()-dspy);
        dspy = 0;
      }
      $('#program').append(copy.css('position', 'absolute').css('left', dspx).css('top', dspy).on('mousedown',blockDrag));
    } else {
      copy.remove();
    }
  });
}

function blockParser(s) {
  let t = '';
  let esc = false;
  let inside = 0;
  let type = '';
  let name = '';
  let opts = [''];
  for(let i = 0; i < s.length; i++) {
    if(s[i]==='\\' && !esc) {
      esc = true;
    } else if(!esc) {
      if(s[i]==='$' && s[i+1]==='{'){
        inside = 1;
      } else if(inside===1 && s[i]==='(') {
        inside = 11;
        type = 'select';
      } else if(inside===11 && s[i]==='/') {
        opts.push('');
      } else if(inside===11 && s[i]===')') {
        inside = 1;
      } else if(inside===1 && s[i]===' ') {
        inside = 2;
      } else if((inside===1||inside===2) && s[i]==='}') {
        if(type.indexOf('{')===0) {
          type = type.substring(1,type.length);
        }
        if((typeof type===undefined||type===null||type==='')||(typeof name===undefined||name===null||name==='')) {
          t += '<span style="font-family:monospaced;backround:gray;border-radius:5px;padding:3px" pname="' + name + '">???</span>';
        } else if(type==='select') {
          t += '<select>';
          for(j in opts){
            t += '<option value"' + j + '">' + opts[j] + '</option>'
          }
          t += '</select>';
        } else if(type==='Blocks') {
          t += '<br/><div class="blocksInput"></div>';
        } else if(type.substring(0,1)==='*') {
          t += '<div class="litBlockInput" accept="' + type.substring(1,type.length) + '" pname="' + name + '">'+ type.substring(1,type.length) +'</div>'
        } else {
          t += '<div class="stdBlockInput" accept="' + type.substring(1,type.length) + '" pname="' + name + '">'+ type +'</div>';
        }
        type = '';
        name = '';
        opts = [''];
        inside = 0;
      } else {
        switch (inside) {
          case 0:
            t += s[i].replace('<','&lt;').replace('>','&gt;');
            break;
          case 1:
            type += s[i].replace('<','&lt;').replace('>','&gt;');
            break;
          case 2:
            name += s[i].replace('<','&lt;').replace('>','&gt;');
            break;
          case 11:
            opts[opts.length-1] += s[i].replace('<','&lt;').replace('>','&gt;');
            break;
        }
      }
    } else {
      switch (inside) {
        case 0:
          t += s[i].replace('<','&lt;').replace('>','&gt;');
          break;
        case 1:
          type += s[i].replace('<','&lt;').replace('>','&gt;');
          break;
        case 2:
          name += s[i].replace('<','&lt;').replace('>','&gt;');
          break;
        case 11:
          opts[opts.length-1] += s[i].replace('<','&lt;').replace('>','&gt;');
          break;
      }
    }
  }
  return t;
}

function togglePalette(e) {
  let mm = function(f) {
    if(f.pageX<e.pageX && document.getElementById('palette').style.display === 'table-cell'){
       document.getElementById('palette').style.display = 'none';
        document.getElementById('togglePalette').style.cursor = 'e-resize';
    } else if(f.pageX>e.pageX && document.getElementById('palette').style.display === 'none') {
      document.getElementById('palette').style.display = 'table-cell';
       document.getElementById('togglePalette').style.cursor = 'w-resize';
    }
  }
  let mu = function() {
    document.removeEventListener('mousemove',mm);
    document.removeEventListener('mouseup',mu);
  };
  document.addEventListener('mousemove',mm);
  document.addEventListener('mouseup',mu);
}
