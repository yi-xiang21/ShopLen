// duong dan breadcrumb
const breadcrumb = document.getElementById('breadcrumb');
if (breadcrumb) {
  const path = window.location.pathname.split("/").pop();
  let pathDisplay = path.replace(".html", "").replace(/-/g, " ");
  if (path === "index.html" || path === "") {
      breadcrumb.innerHTML = `<a href="index.html">Home</a>`;
  } else {
      breadcrumb.innerHTML = `
          <a href="index.html">Home</a>
          <span class="arrow"> > </span>
          <a href="${path}">${capitalize(pathDisplay)}</a>
      `;
  }
  breadcrumb.style.display = 'block';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
