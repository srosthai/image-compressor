document.addEventListener('DOMContentLoaded', function () {
    const uploadContainer = document.getElementById('uploadContainer');
    const fileInput = document.getElementById('fileInput');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const compressionRate = document.getElementById('compressionRate');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const header = document.querySelector('header');
    const themeToggle = document.getElementById('themeToggle');

    // Check if it's a touch device
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    
    // Add a class to body for touch-specific styling if needed
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
    }

    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            // Update meta theme-color for browsers that support it
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#121a17' : '#e7eeea');
            }

            // Animate theme transition
            document.body.classList.add('theme-transition');

            // Set theme after a small delay for smooth transition
            setTimeout(() => {
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);

                setTimeout(() => {
                    document.body.classList.remove('theme-transition');
                }, 500);
            }, 50);
        });
    }

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        // Also update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', savedTheme === 'dark' ? '#121a17' : '#e7eeea');
        }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // If no saved preference, use system preference
        document.documentElement.setAttribute('data-theme', 'dark');
        // Also update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#121a17');
        }
    }

    // Add header scroll animation
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    document.querySelectorAll('.newsletter-form').forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const note = form.parentElement.querySelector('.newsletter-privacy');
            if (note) note.textContent = 'Email signup is not open yet.';
            form.reset();
        });
    });

    const errorMessage = document.getElementById('errorMessage');
    const resultNote = document.getElementById('resultNote');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');

    if (!uploadContainer || !fileInput || !errorMessage) {
        return;
    }

    const maxSize = 90 * 1024 * 1024;
    let currentFile = null;
    let objectUrls = [];
    let runId = 0;

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function fileKind(file) {
        const name = file.name.toLowerCase();
        if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/.test(name)) return 'image';
        if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
        if (/\.(xlsx|docx|pptx)$/.test(name)) return 'office';
        if (/\.(xls|csv|txt|json|xml|svg|html?|md)$/.test(name)) return 'data';
        return '';
    }

    function extensionLabel(name) {
        const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
        return match ? match[1].toUpperCase() : 'FILE';
    }

    function setPreview(image, url, showImage, label) {
        const frame = image.closest('.image-preview');
        let badge = frame.querySelector('.file-badge');
        if (!badge) {
            badge = document.createElement('p');
            badge.className = 'file-badge';
            frame.appendChild(badge);
        }
        if (showImage) {
            image.hidden = false;
            image.src = url;
            badge.hidden = true;
        } else {
            image.hidden = true;
            image.removeAttribute('src');
            badge.hidden = false;
            badge.textContent = label;
        }
    }

    function syncPresets(value) {
        document.querySelectorAll('.preset').forEach((button) => {
            button.setAttribute('aria-pressed', button.dataset.quality === String(value) ? 'true' : 'false');
        });
    }

    function revokeObjectUrls() {
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        objectUrls = [];
    }

    function rememberUrl(url) {
        objectUrls.push(url);
        return url;
    }

    function resetUploadButton() {
        const uploadButton = uploadContainer.querySelector('.upload-btn');
        if (!uploadButton) return;
        uploadButton.textContent = 'Select file';
        uploadButton.classList.remove('processing');
    }

    function showError(message) {
        errorMessage.hidden = false;
        errorMessage.textContent = message;
        loadingIndicator.classList.remove('active');
        uploadContainer.style.display = 'flex';
        resultsContainer.classList.remove('active');
        resetUploadButton();
        fileInput.value = '';
    }

    function hideError() {
        errorMessage.hidden = true;
        errorMessage.textContent = '';
    }

    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, () => {
            uploadContainer.classList.add('highlight');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadContainer.addEventListener(eventName, () => {
            uploadContainer.classList.remove('highlight');
        });
    });

    uploadContainer.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            fileInput.files = files;
            validateAndProcessImage(files[0]);
        }
    });

    // Handle file selection with button animation
    fileInput.addEventListener('change', function () {
        if (this.files.length) validateAndProcessImage(this.files[0]);
    });

    function validateAndProcessImage(file) {
        hideError();

        if (!file || file.size === 0) {
            showError('That file is empty. Choose a file with content.');
            return;
        }

        if (!fileKind(file)) {
            showError('Choose an image, PDF, spreadsheet, document, or text file.');
            return;
        }

        if (file.size > maxSize) {
            showError('That file is over 90 MB. Choose a smaller one.');
            return;
        }

        currentFile = file;
        processImage(file);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            runId += 1;
            currentFile = null;
            revokeObjectUrls();
            hideError();
            if (resultNote) resultNote.textContent = '';
            originalImage.hidden = false;
            compressedImage.hidden = false;
            originalImage.removeAttribute('src');
            compressedImage.removeAttribute('src');
            document.querySelectorAll('.file-badge').forEach((badge) => {
                badge.hidden = true;
            });
            downloadBtn.removeAttribute('href');
            uploadContainer.style.display = 'flex';
            resultsContainer.classList.remove('active');
            fileInput.value = '';
            resetUploadButton();
        });
    }

    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = `${qualitySlider.value}%`;
            syncPresets(qualitySlider.value);
        });

        qualitySlider.addEventListener('change', () => {
            if (currentFile && resultsContainer.classList.contains('active')) {
                processImage(currentFile);
            }
        });
    }

    document.querySelectorAll('.preset').forEach((button) => {
        button.addEventListener('click', () => {
            if (!qualitySlider || !qualityValue) return;
            qualitySlider.value = button.dataset.quality;
            qualityValue.textContent = `${qualitySlider.value}%`;
            syncPresets(qualitySlider.value);
            if (currentFile && resultsContainer.classList.contains('active')) {
                processImage(currentFile);
            }
        });
    });

    async function processImage(file) {
        const id = ++runId;
        hideError();
        uploadContainer.style.display = 'none';
        resultsContainer.classList.remove('active');
        loadingIndicator.classList.add('active');
        revokeObjectUrls();

        const quality = qualitySlider ? Number(qualitySlider.value) / 100 : 0.78;
        const kind = fileKind(file);

        try {
            let compressedFile;
            let extraNote = '';

            if (kind === 'image') {
                if (typeof imageCompression !== 'function') {
                    showError('Compression could not start. Reload the page and try again.');
                    return;
                }
                const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
                compressedFile = await imageCompression(file, {
                    maxSizeMB: Math.max(file.size / (1024 * 1024), 0.1),
                    useWebWorker: true,
                    alwaysKeepResolution: true,
                    initialQuality: quality,
                    fileType: outputType
                });
                const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
                const baseName = file.name.replace(/\.[^.]+$/, '');
                downloadBtn.download = `compressed-${baseName}.${extension}`;
            } else {
                if (!window.fileTools) {
                    showError('Compression could not start. Reload the page and try again.');
                    return;
                }
                const result = await window.fileTools.compress(file, quality);
                compressedFile = result.file;
                extraNote = result.note || '';
                downloadBtn.download = compressedFile.name;
            }

            if (id !== runId) return;

            const originalUrl = rememberUrl(URL.createObjectURL(file));
            const compressedUrl = rememberUrl(URL.createObjectURL(compressedFile));
            setPreview(originalImage, originalUrl, kind === 'image', extensionLabel(file.name));
            setPreview(
                compressedImage,
                compressedUrl,
                kind === 'image',
                extensionLabel(compressedFile.name)
            );
            originalSize.textContent = formatSize(file.size);
            compressedSize.textContent = formatSize(compressedFile.size);

            const saved = file.size - compressedFile.size;
            if (saved > 0) {
                const reduction = (saved / file.size) * 100;
                compressionRate.textContent = `${reduction.toFixed(1)}%`;
                if (resultNote) {
                    resultNote.textContent = extraNote
                        ? `${formatSize(saved)} removed. ${extraNote}`
                        : `${formatSize(saved)} removed.`;
                }
            } else {
                compressionRate.textContent = '0%';
                if (resultNote) {
                    resultNote.textContent = extraNote || 'This quality did not shrink the file. Lower the quality and it will compress again.';
                }
            }

            downloadBtn.href = compressedUrl;

            loadingIndicator.classList.remove('active');
            resultsContainer.classList.add('active');
            resetUploadButton();
        } catch (error) {
            if (id !== runId) return;
            console.error('Error compressing file:', error);
            showError(error && error.userFacing
                ? error.message
                : 'That file could not be compressed. Try a different one.');
        }
    }

});