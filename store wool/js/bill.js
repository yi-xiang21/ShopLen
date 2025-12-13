document.addEventListener("DOMContentLoaded", function () {
  const checkboxAddressAdd = document.getElementById("address_add");
  const inputAddress2 = document.getElementById("address2");

  function themDiaChiKhac() {
    if (checkboxAddressAdd.checked) {
      inputAddress2.style.display = "inline-block";
      inputAddress2.required = true;
      inputAddress2.focus();
    } else {
      inputAddress2.style.display = "none";
      inputAddress2.required = false;
      inputAddress2.value = "";
    }
  }
  if (checkboxAddressAdd) {
    checkboxAddressAdd.addEventListener("change", themDiaChiKhac);
  }
  themDiaChiKhac();
});

// //hien thi meo
// function showLoading() {
//     const overlay = document.getElementById("loadingOverlay");
//     if (overlay) overlay.style.display = "flex"; // Dùng flex để căn giữa
//   }

//   // Hàm ẩn con mèo (Tắt Loading)
//   function hideLoading() {
//     const overlay = document.getElementById("loadingOverlay");
//     if (overlay) overlay.style.display = "none";
//   }
