let img;
let hexColors = [];
let colorList;
let copiedNotification;
let fileInput;
let eyeDropperCursor;
let cursorCanvas;

function preload() {
  // eyeDropperCursor = loadImage('assets/eye-dropper-solid.svg');
}

function setup() {
  createCanvas(600, 600);
  background(255);
  
  cursorCanvas = createGraphics(width, height);
  
  // Upload input
  fileInput = createFileInput(handleFile);
  fileInput.style('display', 'none');
  
  // Clear image button
  let clearImageButton = createButton('Clear image');
  clearImageButton.position(10, height + 15);
  clearImageButton.mousePressed(() => { img = null; });
  
  // Copy button
  let copyAsListButton = createButton('Copy as List');
  copyAsListButton.position(width + 20, height + 60);
  copyAsListButton.mousePressed(copyAsList);
  
  // Clear list button
  let clearListButton = createButton('Clear List');
  clearListButton.position(150, height + 15);
  clearListButton.mousePressed(clearList);

  // Container for the color previews
  colorList = createDiv();
  colorList.position(width + 20, 0);
  colorList.id('colorList');
  
  // Remove duplicates button
  let removeDuplicatesButton = createButton('Remove Duplicates');
  removeDuplicatesButton.id('removeDuplicates');
  removeDuplicatesButton.position(width + 20, height + 15);
  removeDuplicatesButton.mousePressed(removeDuplicates);

  // Copied Notification
  copiedNotification = createP("Copied!");
  copiedNotification.position(width + 25, height + 90);
  copiedNotification.id('copiedNotification');
  copiedNotification.hide();
  
  textFont('Open Sans');
  textSize(20);
}

function draw() {
  background(255);
  cursorCanvas.clear();
  if (img) {
    image(img, 0, 0, width, height, 0, 0, img.width, img.height, CONTAIN, CENTER);
    if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
      cursorCanvas.image(eyeDropperCursor, mouseX-1, mouseY-19, 20, 20);
      cursor('none');
      image(cursorCanvas, 0, 0);
    }
    else {
      cursor('default');
    }
  }
  else {
    push();
    textAlign(CENTER, CENTER);
    text("Click to choose an image to sample from", width/2, height/2);
    pop();
    cursor('default');
  }
}

function handleFile(file) {
  if (file.type === 'image') {
    img = createImg(file.data, '');
    img.hide();
  } else {
    img = null;
  }
}

function mouseClicked() {
  if (mouseX < width && mouseY < height) {
    if(img) {
      image(img, 0, 0, width, height, 0, 0, img.width, img.height, CONTAIN, CENTER); //so cursor doesn't block it!
      let c = get(mouseX, mouseY);
      let hexColor = rgbToHex(c[0], c[1], c[2]);
      hexColors.push(hexColor);
      addColorToList(hexColor);
    }
    else {
      fileInput.elt.click();
    }
  }
}

function addColorToList(hexColor) {
  // Add the color and hex to the color list div
  let colorItem = createDiv();
  colorItem.parent(colorList);
  colorItem.addClass('colorItem');

  let colorCircle = createDiv();
  colorCircle.addClass('colorCircle');
  colorCircle.style('background-color', hexColor);

  colorCircle.parent(colorItem);

  let hexLabel = createP(hexColor);
  hexLabel.addClass('hexLabel');
  hexLabel.parent(colorItem);
  
  colorItem.mousePressed(() => {
    copySingleColorToClipboard(hexLabel.html());
    console.log(hexLabel.html());
  });
}


function copySingleColorToClipboard(color) {
  let tempInput = createInput();
  tempInput.value(color);
  tempInput.elt.select();
  document.execCommand('copy');
  tempInput.remove();
  showCopiedNotification();
}

function rgbToHex(r, g, b) {
  return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

function showCopiedNotification() {
  copiedNotification.show();
  setTimeout(() => {
    copiedNotification.hide();
  }, 1500);
}

function removeDuplicates() {
  let uniqueColors = [...new Set(hexColors)];
  hexColors = uniqueColors;

  // Clear the current colors in the list
  colorList.html('');

  // Re-add the unique colors to the list
  for (let color of uniqueColors) {
    addColorToList(color);
  }
}

function copyAsList() {
  let listStr = "\'" + hexColors.join("\',\'") + "\'";
  let tempInput = createInput();
  tempInput.value(listStr);
  tempInput.elt.select();
  document.execCommand('copy');
  tempInput.remove();
  showCopiedNotification();
}

function clearList() {
  let children = colorList.child();
  for (let i=children.length-1;i>=0;i--) {
    children[i].remove();
  }
  hexColors = [];
}
