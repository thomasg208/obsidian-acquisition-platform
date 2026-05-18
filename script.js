// Script to handle intersection observers for animation and interactive waveform

document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for Timeline Items
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    timelineItems.forEach(item => {
        observer.observe(item);
    });

    // 2. Animated Audio Waveform (Visual only)
    const bars = document.querySelectorAll('.bar');
    
    // Set initial random heights
    bars.forEach(bar => {
        const height = Math.floor(Math.random() * 80) + 10;
        bar.style.height = `${height}%`;
    });
    
    // Real Audio Player Logic
    const audio = document.getElementById('podcast-audio');
    const playBtn = document.querySelector('.btn-play');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    
    let isPlaying = false;
    let audioContext;
    let analyser;
    let dataArray;
    let source;

    function setupAudioContext() {
        // Prevent CORS from muting audio when running directly from a file path
        if (window.location.protocol === 'file:') return;

        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            analyser.fftSize = 64;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function animateWaveform() {
        if (!isPlaying) return;
        requestAnimationFrame(animateWaveform);
        
        let sum = 0;
        
        // Only fetch frequency data if the AudioContext was successfully set up
        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            for(let i=0; i<dataArray.length; i++) sum += dataArray[i];
        }
        
        bars.forEach((bar, index) => {
            let heightPercent;
            if (sum === 0) {
                // Fallback smooth animation if CORS blocks real audio data or running locally
                const time = Date.now() / 200;
                heightPercent = Math.abs(Math.sin(time + index * 0.5)) * 60 + Math.random() * 20 + 10;
            } else {
                // Real frequency data mapped to bars
                const dataIndex = Math.floor(index * (dataArray.length * 0.7) / bars.length);
                let value = dataArray[dataIndex];
                heightPercent = (value / 255) * 90 + 10;
            }
            bar.style.height = `${heightPercent}%`;
        });
    }

    // Format time function (e.g., 65 -> 01:05)
    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    // Load metadata to get duration
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    // Play/Pause functionality
    playBtn.addEventListener('click', () => {
        setupAudioContext();
        
        if (audio.paused) {
            audio.play().then(() => {
                isPlaying = true;
                playBtn.innerHTML = '<i data-lucide="pause" class="fill-icon"></i>';
                lucide.createIcons();
                animateWaveform();
            }).catch(e => {
                console.error("Audio playback failed.", e);
                alert("Please make sure your podcast file is named correctly and exists in the folder.");
            });
        } else {
            audio.pause();
            isPlaying = false;
            playBtn.innerHTML = '<i data-lucide="play" class="fill-icon"></i>';
            lucide.createIcons();
        }
    });

    // Update progress bar as audio plays
    audio.addEventListener('timeupdate', () => {
        const progressRatio = audio.currentTime / audio.duration;
        const percent = progressRatio * 100;
        progressBar.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        
        // Color the waveform bars based on progress
        bars.forEach((bar, index) => {
            const barRatio = index / bars.length;
            if (barRatio <= progressRatio) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });
    });

    // Click on progress bar to seek
    progressContainer.addEventListener('click', (e) => {
        const clickX = e.offsetX;
        const width = progressContainer.clientWidth;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    });

    // Handle end of audio
    audio.addEventListener('ended', () => {
        isPlaying = false;
        playBtn.innerHTML = '<i data-lucide="play" class="fill-icon"></i>';
        lucide.createIcons();
        progressBar.style.width = '0%';
        bars.forEach(bar => bar.classList.remove('active'));
        audio.currentTime = 0;
    });

    // 3. Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(16, 23, 42, 0.8)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(16, 23, 42, 0.4)';
            navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
        }
    });

    // 4. Lightbox Logic
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-image');
    const openBtn = document.getElementById('view-infographics-btn');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');
    const currentIndexSpan = document.getElementById('lightbox-current-index');

    const images = ['infographic-1.png', 'infographic-2.png'];
    let currentLightboxIndex = 0;

    function updateLightbox() {
        if (!lightboxImg) return;
        lightboxImg.src = images[currentLightboxIndex];
        if (currentIndexSpan) currentIndexSpan.textContent = currentLightboxIndex + 1;
    }

    function openLightbox() {
        if (!lightboxModal) return;
        currentLightboxIndex = 0;
        updateLightbox();
        lightboxModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    }

    function nextSlide() {
        currentLightboxIndex = (currentLightboxIndex + 1) % images.length;
        updateLightbox();
    }

    function prevSlide() {
        currentLightboxIndex = (currentLightboxIndex - 1 + images.length) % images.length;
        updateLightbox();
    }

    if (openBtn) openBtn.addEventListener('click', openLightbox);
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    // Close on click outside
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-image-container')) {
                closeLightbox();
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightboxModal || lightboxModal.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
    });

    // 5. Podcast Share Actions
    const shareLinkedin = document.getElementById('share-linkedin');
    const shareTwitter = document.getElementById('share-twitter');
    const shareCopy = document.getElementById('share-copy');
    
    // Compute exact share URL pointing directly to the podcast section
    const getShareUrl = () => {
        return window.location.origin + window.location.pathname + '#podcast';
    };

    if (shareLinkedin) {
        shareLinkedin.addEventListener('click', (e) => {
            e.preventDefault();
            const url = encodeURIComponent(getShareUrl());
            const title = encodeURIComponent("Listen to the Founder's Briefing on OBSIDIAN— luxury ambient biometric identity platform.");
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=600,height=600');
        });
    }

    if (shareTwitter) {
        shareTwitter.addEventListener('click', (e) => {
            e.preventDefault();
            const url = encodeURIComponent(getShareUrl());
            const text = encodeURIComponent("Listen to the Founder's Briefing on OBSIDIAN—the next-generation luxury ambient security intelligence platform.");
            window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
        });
    }

    if (shareCopy) {
        shareCopy.addEventListener('click', () => {
            const url = getShareUrl();
            navigator.clipboard.writeText(url).then(() => {
                // Trigger Toast HUD Notification
                showToast("LINK COPIED", "Secure briefing URL is copied to clipboard.");
                
                // Temporary tooltip visual feed
                const tooltip = document.getElementById('copy-tooltip');
                if (tooltip) {
                    tooltip.textContent = "Copied!";
                    setTimeout(() => {
                        tooltip.textContent = "Copy Link";
                    }, 2000);
                }
            }).catch(err => {
                console.error("Clipboard copy failed", err);
            });
        });
    }

    // Helper to generate a gorgeous HUD Toast dynamic alert
    function showToast(title, message) {
        let toast = document.getElementById('toast-hud-alert');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-hud-alert';
            toast.className = 'hud-toast';
            toast.innerHTML = `
                <div class="hud-toast-icon"><i data-lucide="shield-check"></i></div>
                <div class="hud-toast-text">
                    <h4 id="toast-title"></h4>
                    <p id="toast-message"></p>
                </div>
            `;
            document.body.appendChild(toast);
        }
        
        document.getElementById('toast-title').textContent = title;
        document.getElementById('toast-message').textContent = message;
        
        // Render lucide icon in toast
        lucide.createIcons();
        
        // Slide in
        setTimeout(() => {
            toast.classList.add('active');
        }, 100);
        
        // Slide out
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3500);
    }
});
