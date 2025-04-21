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
                metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#111827' : '#6366f1');
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
            metaThemeColor.setAttribute('content', savedTheme === 'dark' ? '#111827' : '#6366f1');
        }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // If no saved preference, use system preference
        document.documentElement.setAttribute('data-theme', 'dark');
        // Also update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#111827');
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

    // Animate elements on load with a staggered delay
    function animateElements() {
        const elements = document.querySelectorAll('.hero, .hero p, .compressor, .footer-section, .feature-card');
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 200 * index);
        });

        // Add smooth hover effect to cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', function (e) {
                const cardRect = this.getBoundingClientRect();
                const cardCenterX = cardRect.left + cardRect.width / 2;
                const cardCenterY = cardRect.top + cardRect.height / 2;
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                // Calculate the angle of the tilt
                const angleX = (mouseY - cardCenterY) / 25;
                const angleY = (cardCenterX - mouseX) / 25;

                this.style.transform = `translateY(-10px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
            });
        });

        // Add badge animation
        const badges = document.querySelectorAll('.badge');
        badges.forEach(badge => {
            badge.style.opacity = '0';
            badge.style.transform = 'translateY(20px)';

            setTimeout(() => {
                badge.style.transition = 'all 0.5s ease';
                badge.style.opacity = '1';
                badge.style.transform = 'translateY(0)';
            }, 1000);
        });
    }

    // Call animateElements initially
    animateElements();

    // Re-animate on theme change
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            // The theme toggle logic is already implemented earlier
            // We just need to add re-animation after theme change
            setTimeout(() => {
                // Reset and re-animate badges and feature cards
                const badges = document.querySelectorAll('.badge');
                badges.forEach(badge => {
                    badge.style.transition = 'all 0.5s ease';
                    badge.style.transform = 'translateY(0)';
                    badge.style.opacity = '1';
                });

                const featureCards = document.querySelectorAll('.feature-card');
                featureCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.transition = 'all 0.5s ease';
                        card.style.transform = 'translateY(0)';
                        card.style.opacity = '1';
                    }, 100 * index);
                });
            }, 300);
        });
    }

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.upload-btn, .reset-btn, .download-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;

            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.width = '100px';
            ripple.style.height = '100px';
            ripple.style.borderRadius = '50%';
            ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
            ripple.style.transform = 'scale(0)';
            ripple.style.top = `${y}px`;
            ripple.style.left = `${x}px`;
            ripple.style.pointerEvents = 'none';

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            requestAnimationFrame(() => {
                ripple.style.transition = 'transform 0.6s, opacity 0.6s';
                ripple.style.transform = 'scale(4)';
                ripple.style.opacity = '0';

                setTimeout(() => {
                    if (ripple && ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 700);
            });
        });
    });

    // Skip the image compression code if we're not on a page with the upload container
    if (!uploadContainer || !fileInput) {
        // Add hover animation for footer links - this works on all pages
        const footerLinks = document.querySelectorAll('.footer-links a');
        footerLinks.forEach(link => {
            link.addEventListener('mouseenter', function () {
                this.style.transform = 'translateX(5px)';
            });

            link.addEventListener('mouseleave', function () {
                this.style.transform = 'translateX(0)';
            });
        });

        // Add animation for social icons - this works on all pages
        const socialIcons = document.querySelectorAll('.social-icon');
        socialIcons.forEach((icon, index) => {
            icon.style.opacity = '0';
            icon.style.transform = 'translateY(0)';
            
            setTimeout(() => {
                icon.style.transition = 'opacity 0.5s, transform 0.5s';
                icon.style.opacity = '1';
                icon.style.transform = 'translateY(0)';
            }, 1000 + (100 * index));
        });

        return; // Exit early if we're not on the main page
    }

    // Create error message container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.color = 'var(--error-color, #ef4444)';
    errorContainer.style.fontSize = '0.875rem';
    errorContainer.style.marginTop = '10px';
    errorContainer.style.textAlign = 'center';
    errorContainer.style.fontWeight = '500';
    errorContainer.style.display = 'none';
    uploadContainer.appendChild(errorContainer);

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
        if (this.files.length) {
            const uploadButton = uploadContainer.querySelector('.upload-btn');
            uploadButton.innerHTML = 'Processing...';
            uploadButton.classList.add('processing');

            // Hide any previous error messages
            errorContainer.style.display = 'none';

            setTimeout(() => {
                validateAndProcessImage(this.files[0]);
            }, 500); // Small delay for better UX
        }
    });

    // Validate file size and process image
    function validateAndProcessImage(file) {
        // Clear any previous error
        errorContainer.style.display = 'none';

        // Check if file size exceeds 90MB (90 * 1024 * 1024 bytes)
        const maxSize = 90 * 1024 * 1024; // 90MB in bytes
        if (file.size > maxSize) {
            // Show error message
            errorContainer.textContent = 'File size exceeds 90MB limit. Please select a smaller image.';
            errorContainer.style.display = 'block';

            // Reset the upload button
            const uploadButton = uploadContainer.querySelector('.upload-btn');
            uploadButton.innerHTML = 'Select Image';
            uploadButton.classList.remove('processing');

            // Reset the file input
            fileInput.value = '';
            return;
        }

        // If file size is within limits, proceed with processing
        processImage(file);
    }

    // Reset functionality with animation
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            resultsContainer.classList.add('fade-out');
            
            // Revoke any existing object URLs to prevent memory leaks
            if (originalImage.src && originalImage.src.startsWith('blob:')) {
                URL.revokeObjectURL(originalImage.src);
            }
            if (compressedImage.src && compressedImage.src.startsWith('blob:')) {
                URL.revokeObjectURL(compressedImage.src);
            }
            if (downloadBtn.href && downloadBtn.href.startsWith('blob:')) {
                URL.revokeObjectURL(downloadBtn.href);
            }

            // Hide any error messages
            errorContainer.style.display = 'none';

            setTimeout(() => {
                uploadContainer.style.display = 'flex';
                uploadContainer.classList.add('fade-in');
                resultsContainer.classList.remove('active', 'fade-out');
                fileInput.value = '';

                // Reset the upload button
                const uploadButton = uploadContainer.querySelector('.upload-btn');
                if (uploadButton) {
                    uploadButton.innerHTML = 'Select Image';
                    uploadButton.classList.remove('processing');
                }

                setTimeout(() => {
                    uploadContainer.classList.remove('fade-in');
                }, 500);
            }, 300);
        });
    }

    // Enhanced animation for loading
    function animateLoading() {
        loadingIndicator.innerHTML = '';

        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'spinner-container';

        const spinner = document.createElement('span');
        spinner.className = 'spinner';

        const loadingText = document.createElement('p');
        loadingText.textContent = 'Compressing your image...';
        loadingText.className = 'loading-text';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';

        const progress = document.createElement('div');
        progress.className = 'progress';

        progressBar.appendChild(progress);
        spinnerContainer.appendChild(spinner);

        loadingIndicator.appendChild(spinnerContainer);
        loadingIndicator.appendChild(loadingText);
        loadingIndicator.appendChild(progressBar);

        // Simulate progress for better UX
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
            } else {
                width += Math.random() * 5;
                progress.style.width = `${Math.min(width, 90)}%`;
            }
        }, 200);

        return () => {
            clearInterval(interval);
            progress.style.width = '100%';
        };
    }

    // Process and compress the image with enhanced animations
    async function processImage(file) {
        if (!file || !file.type.match('image.*')) {
            errorContainer.textContent = 'Please select a valid image file';
            errorContainer.style.display = 'block';

            // Reset the upload button
            const uploadButton = uploadContainer.querySelector('.upload-btn');
            uploadButton.innerHTML = 'Select Image';
            uploadButton.classList.remove('processing');

            return;
        }

        // Clear existing object URLs to prevent memory leaks
        if (originalImage.src && originalImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(originalImage.src);
        }
        if (compressedImage.src && compressedImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(compressedImage.src);
        }
        if (downloadBtn.href && downloadBtn.href.startsWith('blob:')) {
            URL.revokeObjectURL(downloadBtn.href);
        }

        uploadContainer.style.display = 'none';
        loadingIndicator.classList.add('active');

        const completeLoading = animateLoading();

        try {
            // Get original file details
            const originalSizeKB = (file.size / 1024).toFixed(2);
            originalSize.textContent = `${originalSizeKB} KB`;

            // Display original image
            const originalURL = URL.createObjectURL(file);
            originalImage.onload = function() {
                // Release object URL once image is loaded
                URL.revokeObjectURL(originalURL);
            };
            originalImage.src = originalURL;

            // Compress the image with improved options for mobile
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: isTouchDevice ? 1280 : 1920, // Smaller size for mobile
                useWebWorker: true,
                alwaysKeepResolution: true, // Helps maintain quality
                initialQuality: 0.8
            };

            const compressedFile = await imageCompression(file, options);
            const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
            compressedSize.textContent = `${compressedSizeKB} KB`;

            // Calculate compression percentage
            const reduction = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);

            // Animate the counting of the percentage
            let currentValue = 0;
            const targetValue = parseFloat(reduction);
            const duration = 1500; // 1.5 seconds
            const interval = 16; // roughly 60 fps
            const steps = duration / interval;
            const increment = targetValue / steps;

            const counter = setInterval(() => {
                currentValue += increment;

                if (currentValue >= targetValue) {
                    currentValue = targetValue;
                    clearInterval(counter);
                }

                compressionRate.textContent = `${currentValue.toFixed(1)}%`;
            }, interval);

            // Display compressed image
            const compressedURL = URL.createObjectURL(compressedFile);
            compressedImage.onload = function() {
                // Release object URL once image is loaded
                URL.revokeObjectURL(compressedURL);
            };
            compressedImage.src = compressedURL;

            // Set up download button
            const compressedBlob = compressedFile.slice(0, compressedFile.size, compressedFile.type);
            const blobUrl = URL.createObjectURL(compressedBlob);
            downloadBtn.href = blobUrl;
            downloadBtn.download = `compressed-${file.name}`;
            
            // Add download completion listener
            downloadBtn.addEventListener('click', function() {
                // Create a timeout to revoke the URL after download starts
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                }, 3000); // Longer timeout to ensure download completes
            });

            // Complete the loading animation and show results with delay for smoother transition
            setTimeout(() => {
                completeLoading();

                setTimeout(() => {
                    loadingIndicator.classList.remove('active');
                    resultsContainer.classList.add('active');

                    // Add animation classes to elements
                    const elements = resultsContainer.querySelectorAll('.image-card, .compression-stats, .action-buttons');
                    elements.forEach((el, i) => {
                        el.style.opacity = '0';
                        el.style.transform = 'translateY(20px)';

                        setTimeout(() => {
                            el.style.transition = 'opacity 0.5s, transform 0.5s';
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, 100 * i);
                    });
                }, 400);
            }, 800);

        } catch (error) {
            console.error('Error compressing image:', error);

            // Show error in the error container when we return to the upload view
            errorContainer.textContent = 'Error compressing image. Please try again.';

            loadingIndicator.classList.remove('active');
            uploadContainer.style.display = 'flex';
            errorContainer.style.display = 'block';

            // Reset the upload button
            const uploadButton = uploadContainer.querySelector('.upload-btn');
            if (uploadButton) {
                uploadButton.innerHTML = 'Select Image';
                uploadButton.classList.remove('processing');
            }
        }
    }

    // Add hover animation for footer links
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
        link.addEventListener('mouseenter', function () {
            this.style.transform = 'translateX(5px)';
        });

        link.addEventListener('mouseleave', function () {
            this.style.transform = 'translateX(0)';
        });
    });

    // Add animation for social icons
    const socialIcons = document.querySelectorAll('.social-icon');
    socialIcons.forEach((icon, index) => {
        icon.style.opacity = '0';
        icon.style.transform = 'translateY(0)';
        
        setTimeout(() => {
            icon.style.transition = 'opacity 0.5s, transform 0.5s';
            icon.style.opacity = '1';
            icon.style.transform = 'translateY(0)';
        }, 1000 + (100 * index));
    });
});