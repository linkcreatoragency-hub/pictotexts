/* PicToTexts.com — client-side OCR powered by Tesseract.js
   Images are processed entirely in the user's browser. Nothing is uploaded. */
(function () {
  var dropzone = document.getElementById('dropzone');
  var fileInput = document.getElementById('fileInput');
  var langSelect = document.getElementById('langSelect');
  var progressWrap = document.getElementById('progressWrap');
  var progressFill = document.getElementById('progressFill');
  var progressLabel = document.getElementById('progressLabel');
  var resultWrap = document.getElementById('resultWrap');
  var resultText = document.getElementById('resultText');
  var copyBtn = document.getElementById('copyBtn');
  var downloadBtn = document.getElementById('downloadBtn');
  var clearBtn = document.getElementById('clearBtn');
  var previewList = document.getElementById('previewList');
  var wordCount = document.getElementById('wordCount');
  var errNotice = document.getElementById('errNotice');
  if (!dropzone) return;

  var busy = false;

  function setProgress(pct, label) {
    progressWrap.style.display = 'block';
    progressFill.style.width = pct + '%';
    progressLabel.textContent = label;
  }

  function showError(msg) {
    errNotice.textContent = msg;
    errNotice.style.display = 'block';
    setTimeout(function () { errNotice.style.display = 'none'; }, 6000);
  }

  function updateCount() {
    var t = resultText.value.trim();
    var words = t ? t.split(/\s+/).length : 0;
    wordCount.textContent = words + ' words · ' + t.length + ' characters';
  }

  function handleFiles(files) {
    if (busy) return;
    var images = Array.prototype.filter.call(files, function (f) {
      return /^image\/(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(f.type) || /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(f.name);
    });
    if (!images.length) { showError('Please choose an image file (JPG, PNG, WEBP, BMP, GIF or TIFF).'); return; }
    if (images.length > 10) { images = images.slice(0, 10); showError('Maximum 10 images at once — processing the first 10.'); }

    previewList.innerHTML = '';
    images.forEach(function (f) {
      var img = document.createElement('img');
      img.alt = 'Uploaded picture preview';
      img.src = URL.createObjectURL(f);
      previewList.appendChild(img);
    });

    busy = true;
    dropzone.style.opacity = '.6';
    resultWrap.style.display = 'none';
    var lang = langSelect.value;
    var texts = [];
    var done = 0;

    setProgress(2, 'Loading OCR engine…');

    Tesseract.createWorker(lang, 1, {
      logger: function (m) {
        if (m.status === 'recognizing text') {
          var base = (done / images.length) * 100;
          var pct = base + (m.progress * 100) / images.length;
          setProgress(Math.min(99, Math.round(pct)), 'Extracting text from image ' + (done + 1) + ' of ' + images.length + '… ' + Math.round(m.progress * 100) + '%');
        }
      }
    }).then(function (worker) {
      var chain = Promise.resolve();
      images.forEach(function (f) {
        chain = chain.then(function () {
          return worker.recognize(f).then(function (res) {
            texts.push(res.data.text.trim());
            done++;
          });
        });
      });
      return chain.then(function () { return worker.terminate(); });
    }).then(function () {
      setProgress(100, 'Done!');
      resultText.value = texts.join('\n\n----------\n\n');
      resultWrap.style.display = 'block';
      updateCount();
      busy = false;
      dropzone.style.opacity = '1';
      setTimeout(function () { progressWrap.style.display = 'none'; }, 1200);
      resultWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }).catch(function (e) {
      busy = false;
      dropzone.style.opacity = '1';
      progressWrap.style.display = 'none';
      showError('Sorry, something went wrong while reading the image. Please try another picture.');
      if (window.console) console.error(e);
    });
  }

  dropzone.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () { if (fileInput.files.length) handleFiles(fileInput.files); fileInput.value = ''; });

  ['dragenter', 'dragover'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove('drag'); });
  });
  dropzone.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });

  document.addEventListener('paste', function (e) {
    if (!e.clipboardData) return;
    var items = e.clipboardData.items;
    var files = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type.indexOf('image') === 0) files.push(items[i].getAsFile());
    }
    if (files.length) handleFiles(files);
  });

  copyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(resultText.value).then(function () {
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(function () { copyBtn.textContent = 'Copy Text'; copyBtn.classList.remove('copied'); }, 2000);
    });
  });

  downloadBtn.addEventListener('click', function () {
    var blob = new Blob([resultText.value], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'extracted-text.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  clearBtn.addEventListener('click', function () {
    resultText.value = '';
    previewList.innerHTML = '';
    resultWrap.style.display = 'none';
  });

  resultText.addEventListener('input', updateCount);
})();

/* Mobile menu */
(function () {
  var btn = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  if (btn) btn.addEventListener('click', function () { links.classList.toggle('open'); });
})();
