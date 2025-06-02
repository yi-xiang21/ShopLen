document.addEventListener('click', function (e) {
  const searchLi = document.querySelector('.search-li');
  const toggle = document.getElementById('toggle-search');
  if (!searchLi.contains(e.target)) {
    toggle.checked = false;
  }
});

const productsItem = document.querySelector('.products-item');
const btnLeft = document.querySelector('.slider-btn.left');
const btnRight = document.querySelector('.slider-btn.right');
btnLeft.onclick = () => {
  productsItem.scrollBy({ left: -productsItem.offsetWidth * 0.5, behavior: 'smooth' });
};
btnRight.onclick = () => {
  productsItem.scrollBy({ left: productsItem.offsetWidth * 0.5, behavior: 'smooth' });
};



