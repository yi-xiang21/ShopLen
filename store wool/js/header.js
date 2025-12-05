document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector('header[data-inserted="true"]')) return;

  const headerHTML = `
    <header data-inserted="true">
      <ul>
        <li><img src="img/Logo.png" alt="Logo"></li>
        <ul id="nav">
          <li><a href="index.html">Home</a></li>
          <li><a href="shop.html">Shop</a></li>
          <li><a href="workshop.html">Workshops</a></li>
          <li><a href="about.html">About</a></li>
          
          <li class="cart">
            <a href="cart.html">
              <i class="cart bi bi-cart"></i>
            </a>
          </li>
          <li class="user-menu-li">
            <a href="#">
              <i class="bi bi-person"></i>
            </a>
            <ul class="user-dropdown">
              <li>
                <a class="go-admin" href="admin.html">
                  <i class="bi bi-shield-lock"></i> Admin
                </a>
              </li>
              <li>
                <a class="go-register" href="register.html">
                  <i class="bi bi-person-plus"></i> Sign up
                </a>
              </li>
              <li>
                <a class="go-login" href="login.html">
                  <i class="bi bi-box-arrow-in-right"></i> Log in
                </a>
              </li>
              <li>
                <a class="go-account" href="account.html">
                  <i class="bi bi-person-circle"></i> Account
                </a>
              </li>
              <li>
                <a class="go-logout" href="login.html">
                  <i class="bi bi-box-arrow-in-left"></i> Log out
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </ul>
    </header>
  `;

  // Chèn vào đầu body hoặc thay thế placeholder nếu có
  const placeholder =
    document.getElementById("header-placeholder") ||
    document.querySelector("[data-insert-header]");
  const headerEl = document.createElement("div");
  headerEl.innerHTML = headerHTML;
  if (placeholder) {
    placeholder.replaceWith(headerEl.firstElementChild);
  } else {
    document.body.insertAdjacentElement(
      "afterbegin",
      headerEl.firstElementChild
    );
  }
});
