// The phone-sized menu: the hamburger button opens a full-screen list of links.
// On wider screens the links are always showing and this does nothing.
(function () {
  var menu = document.getElementById('menu');
  var openButton = document.querySelector('.menu-open');
  var closeButton = document.querySelector('.menu-close');
  if (!menu || !openButton || !closeButton) return;

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-is-open', open);  // stops the page behind from scrolling
    openButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      menu.setAttribute('role', 'dialog');
      menu.setAttribute('aria-modal', 'true');
      menu.setAttribute('aria-label', 'Menu');
      (menu.querySelector('a') || closeButton).focus();
    } else {
      menu.removeAttribute('role');
      menu.removeAttribute('aria-modal');
      menu.removeAttribute('aria-label');
      openButton.focus();
    }
  }

  openButton.addEventListener('click', function () { setOpen(true); });
  closeButton.addEventListener('click', function () { setOpen(false); });

  menu.addEventListener('keydown', function (event) {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Tab') {
      // Keep keyboard focus inside the open menu.
      var items = menu.querySelectorAll('a[href], button');
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // If the window grows past the phone breakpoint while the menu is open, close it.
  var wide = window.matchMedia('(min-width: 600px)');
  wide.addEventListener('change', function (event) {
    if (event.matches && isOpen()) setOpen(false);
  });
})();
