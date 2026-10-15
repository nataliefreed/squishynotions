// Opens and closes the phone-sized menu. WordPress did this with its Interactivity API;
// this does the same job in a few lines and uses the same classes, so the styling is unchanged.
(function () {
  var nav = document.querySelector('.wp-block-navigation');
  if (!nav) return;
  var openButton = nav.querySelector('.wp-block-navigation__responsive-container-open');
  var closeButton = nav.querySelector('.wp-block-navigation__responsive-container-close');
  var menu = nav.querySelector('.wp-block-navigation__responsive-container');
  var dialog = nav.querySelector('.wp-block-navigation__responsive-dialog');
  if (!openButton || !closeButton || !menu) return;

  function isOpen() {
    return menu.classList.contains('is-menu-open');
  }

  function setOpen(open) {
    menu.classList.toggle('is-menu-open', open);
    menu.classList.toggle('has-modal-open', open);
    document.documentElement.classList.toggle('has-modal-open', open);
    openButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (dialog) {
      if (open) {
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', 'Menu');
      } else {
        dialog.removeAttribute('role');
        dialog.removeAttribute('aria-modal');
        dialog.removeAttribute('aria-label');
      }
    }
    if (open) {
      (menu.querySelector('a') || closeButton).focus();
    } else {
      openButton.focus();
    }
  }

  openButton.addEventListener('click', function () { setOpen(true); });
  closeButton.addEventListener('click', function () { setOpen(false); });

  menu.addEventListener('keydown', function (event) {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === 'Tab') {
      // Keep keyboard focus inside the open menu.
      var items = menu.querySelectorAll('a[href], button');
      if (!items.length) return;
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
  if (window.matchMedia) {
    var wide = window.matchMedia('(min-width: 600px)');
    var onChange = function (e) { if (e.matches && isOpen()) setOpen(false); };
    if (wide.addEventListener) wide.addEventListener('change', onChange);
    else if (wide.addListener) wide.addListener(onChange);
  }
})();
