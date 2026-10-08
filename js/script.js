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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 90 * 1024 * 1024;
    let currentFile = null;
    let objectUrls = [];
    let runId = 0;

    function formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function isAllowedImage(file) {
        if (allowedTypes.includes(file.type)) return true;
        return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
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
        uploadButton.textContent = 'Select image';
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
            showError('That file is empty. Choose an image with content.');
            return;
        }

        if (!isAllowedImage(file)) {
            showError('Choose a JPG, PNG, WebP, or GIF.');
            return;
        }

        if (file.size > maxSize) {
            showError('That image is over 90 MB. Choose a smaller one.');
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
            originalImage.removeAttribute('src');
            compressedImage.removeAttribute('src');
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
        });

        qualitySlider.addEventListener('change', () => {
            if (currentFile && resultsContainer.classList.contains('active')) {
                processImage(currentFile);
            }
        });
    }

    async function processImage(file) {
        if (typeof imageCompression !== 'function') {
            showError('Compression could not start. Reload the page and try again.');
            return;
        }

        const id = ++runId;
        hideError();
        uploadContainer.style.display = 'none';
        resultsContainer.classList.remove('active');
        loadingIndicator.classList.add('active');
        revokeObjectUrls();

        const quality = qualitySlider ? Number(qualitySlider.value) / 100 : 0.8;

        try {
            const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
            const compressedFile = await imageCompression(file, {
                maxSizeMB: Math.max(file.size / (1024 * 1024), 0.1),
                useWebWorker: true,
                alwaysKeepResolution: true,
                initialQuality: quality,
                fileType: outputType
            });

            if (id !== runId) return;

            const originalUrl = rememberUrl(URL.createObjectURL(file));
            const compressedUrl = rememberUrl(URL.createObjectURL(compressedFile));
            originalImage.src = originalUrl;
            compressedImage.src = compressedUrl;
            originalSize.textContent = formatSize(file.size);
            compressedSize.textContent = formatSize(compressedFile.size);

            const saved = file.size - compressedFile.size;
            if (saved > 0) {
                const reduction = (saved / file.size) * 100;
                compressionRate.textContent = `${reduction.toFixed(1)}%`;
                if (resultNote) resultNote.textContent = `${formatSize(saved)} removed.`;
            } else {
                compressionRate.textContent = '0%';
                if (resultNote) {
                    resultNote.textContent = 'This quality did not shrink the file. Lower the quality and it will compress again.';
                }
            }

            const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
            const baseName = file.name.replace(/\.[^.]+$/, '');
            downloadBtn.href = compressedUrl;
            downloadBtn.download = `compressed-${baseName}.${extension}`;

            loadingIndicator.classList.remove('active');
            resultsContainer.classList.add('active');
            resetUploadButton();
        } catch (error) {
            if (id !== runId) return;
            console.error('Error compressing image:', error);
            showError('That image could not be compressed. Try a JPG or PNG.');
        }
    }

});