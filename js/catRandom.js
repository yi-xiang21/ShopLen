document.addEventListener("DOMContentLoaded", () => {
  const catContainer = document.getElementById("cat-container");
  const catPlayer = document.getElementById("cat-animation");

  // Hàm random vị trí ngang
  function setRandomLeft() {
    // Random từ 5% đến 85% màn hình
    const randomLeft = Math.floor(Math.random() * 80) + 5;
    catContainer.style.left = randomLeft + "%";
  }

  function showCat() {
    // BƯỚC 1: Random vị trí trước
    setRandomLeft();
    setTimeout(() => {
      catPlayer.play();
    }, 50);

    // BƯỚC 3: Thu mèo vào
    setTimeout(hideCat, 3000);
  }

  function hideCat() {

    // Sau khi thụt xong (0.8s transition) thì dừng player cho nhẹ
    setTimeout(() => {
      catPlayer.stop();
    }, 1000);
  }
  function scheduleNextCat() {
    const randomTime = Math.floor(Math.random() * 50000);

    // 2. Hẹn giờ
    setTimeout(() => {
      showCat();
      scheduleNextCat();
    }, randomTime);
  }
  scheduleNextCat();
});
