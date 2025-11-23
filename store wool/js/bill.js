document.addEventListener('DOMContentLoaded', function () {
    const checkboxAddressAdd = document.getElementById('address_add');
    const inputAddress2 = document.getElementById('address2');

    function themDiaChiKhac() {
        if (checkboxAddressAdd.checked) {
            inputAddress2.style.display = 'inline-block';
            inputAddress2.required = true;
            inputAddress2.focus();
        } else {
            inputAddress2.style.display = 'none';
            inputAddress2.required = false;
            inputAddress2.value = '';
        }
    }
    if (checkboxAddressAdd) {
        checkboxAddressAdd.addEventListener('change', themDiaChiKhac);
    }
    themDiaChiKhac()
});