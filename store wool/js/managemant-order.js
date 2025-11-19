document.addEventListener('DOMContentLoaded', function () {

    const btnview=document.getElementById('btn-view-order');
    const main=document.getElementById('order-main');
    const view=document.getElementById('order-view');
    const btnback=document.getElementById('btn-back');
    const title=document.getElementById('section-title-p');
    btnview.addEventListener('click', () => {
        view.style.display='block';
        main.style.display='none';
        title.innerText='Order View';
    });
    btnback.addEventListener('click', () => {
        view.style.display='none';
        main.style.display='block';
        title.innerText='Order Management';
    });
});