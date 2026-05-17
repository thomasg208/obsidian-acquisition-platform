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
});
