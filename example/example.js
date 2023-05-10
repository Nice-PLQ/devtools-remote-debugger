const request = document.querySelector('#request');
const jsError = document.querySelector('#js-error');
const func1 = document.querySelector('#func1');
const func2 = document.querySelector('#func2');

jsError.onclick = function() {
  a.b.c();
};

request.onclick = function () {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/remote/debug/json');
  xhr.send(null);
};

func1.onclick = function () {
  const panel1 = document.querySelector('#panel1');
  const mask = panel1.querySelector('.popup__mask');
  const button = panel1.querySelector('.button');
  panel1.style.display = 'block';

  mask.onclick = function () {
    panel1.style.display = 'none';
  };
  button.onclick = function () {
    panel1.style.display = 'none';
  };
};

func2.onclick = function () {
  const panel2 = document.querySelector('#panel2');
  const mask = panel2.querySelector('.popup__mask');
  const action = panel2.querySelector('.action-sheet__action');
  panel2.style.display = 'block';

  mask.onclick = function () {
    panel2.style.display = 'none';
  };
  action.onclick = function () {
    panel2.style.display = 'none';
  };
};
