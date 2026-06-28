// ⚠️ Apne Worker ka URL yahan dalein
const WORKER_URL = 'https://trt-channel-api.YOUR_SUBDOMAIN.workers.dev';

let currentPlaylistId = null;
let nextPageToken = null;
let allVideosLoaded = false;
let currentChannelData = null;
let autoFetchInterval = null;
let lastFetchTime = null;
let totalVideos = 0;

// Page load hone par automatically videos fetch karo
window.addEventListener('DOMContentLoaded', () => {
    console.log('TRT CHANNEL App Loaded');
    
    // Default channel set karo
    const channelInput = document.getElementById('channelInput');
    if (channelInput) {
        channelInput.value = '@kurulusosmanurduatv';
    }
    
    // Theme load karo
    loadTheme();
    
    // Auto-fetch start karo
    startAutoFetch();
    
    // Automatically fetch videos
    setTimeout(() => {
        fetchVideos();
    }, 1000);
});

// Fetch Videos Function (Main Button)
async function fetchVideos() {
    console.log('Fetch Videos button clicked');
    showToast('📥 Latest videos fetch kar rahe hain...', 'info');
    
    const input = document.getElementById('channelInput').value.trim();
    const statusMsg = document.getElementById('statusMessage');
    const videoGrid = document.getElementById('videoGrid');
    const loadingAnimation = document.getElementById('loadingAnimation');
    const noVideos = document.getElementById('noVideos');
    const fetchIcon = document.getElementById('fetchIcon');
    const fetchText = document.getElementById('fetchText');
    
    // Reset
    if (videoGrid) videoGrid.innerHTML = '';
    nextPageToken = null;
    allVideosLoaded = false;    currentPlaylistId = null;
    totalVideos = 0;
    
    // Show loading
    if (loadingAnimation) loadingAnimation.style.display = 'block';
    if (noVideos) noVideos.style.display = 'none';
    if (statusMsg) statusMsg.style.display = 'none';
    
    // Button animation
    if (fetchIcon) fetchIcon.classList.add('fa-spin');
    if (fetchText) fetchText.textContent = 'Fetching...';
    
    if (!input) {
        showStatus('❌ Please enter a channel URL or @handle', 'error');
        hideLoading();
        return;
    }

    try {
        // Channel ID fetch karna
        let channelEndpoint = `${WORKER_URL}/channels?`;
        
        if (input.includes('@')) {
            const handle = input.match(/@([a-zA-Z0-9_\-\.]+)/)[1];
            channelEndpoint += `handle=${handle}`;
            console.log('Fetching channel by handle:', handle);
        } else if (input.includes('/channel/')) {
            const channelId = input.match(/\/channel\/([a-zA-Z0-9_\-]+)/)[1];
            channelEndpoint += `id=${channelId}`;
            console.log('Fetching channel by ID:', channelId);
        } else {
            showStatus('❌ Invalid format! Use @handle or channel link', 'error');
            hideLoading();
            return;
        }

        console.log('Fetching from:', channelEndpoint);
        
        const channelRes = await fetch(channelEndpoint);
        console.log('Channel response status:', channelRes.status);
        
        const channelData = await channelRes.json();
        console.log('Channel data:', channelData);

        if (!channelData.items || channelData.items.length === 0) {
            showStatus('❌ Channel not found! Check the URL.', 'error');
            hideLoading();
            return;
        }
        currentChannelData = channelData.items[0];
        const channelTitle = currentChannelData.snippet.title;
        currentPlaylistId = currentChannelData.contentDetails.relatedPlaylists.uploads;

        console.log('✅ Channel found:', channelTitle);
        console.log('Playlist ID:', currentPlaylistId);

        showStatus(`✅ <strong>${channelTitle}</strong> ki videos load ho rahi hain...`, 'success');

        // Videos load karo
        await loadMoreVideos();
        
        // Last fetch time update karo
        lastFetchTime = new Date();
        updateFetchInfo();

    } catch (error) {
        console.error('Error in fetchVideos:', error);
        showStatus('❌ Error: ' + error.message, 'error');
        showToast('❌ Videos fetch karne me error aaya', 'error');
    } finally {
        hideLoading();
        if (fetchIcon) fetchIcon.classList.remove('fa-spin');
        if (fetchText) fetchText.textContent = '📥 Fetch Latest Videos';
    }
}

// Load More Videos
async function loadMoreVideos() {
    console.log('loadMoreVideos called');
    
    const statusMsg = document.getElementById('statusMessage');
    const videoGrid = document.getElementById('videoGrid');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const noVideos = document.getElementById('noVideos');
    
    if (allVideosLoaded) {
        console.log('All videos already loaded');
        showToast('✅ Saari videos load ho chuki hain!', 'success');
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
    }

    try {
        let videosUrl = `${WORKER_URL}/playlist-items?playlistId=${currentPlaylistId}&maxResults=50`;
        
        if (nextPageToken) {
            videosUrl += `&pageToken=${nextPageToken}`;
            console.log('Loading next page with token:', nextPageToken);
        }
        console.log('Fetching videos from:', videosUrl);
        
        const videosRes = await fetch(videosUrl);
        console.log('Videos response status:', videosRes.status);
        
        const videosData = await videosRes.json();
        console.log('Videos data received:', videosData);

        if (videosData.items.length === 0) {
            if (noVideos) noVideos.style.display = 'block';
            console.log('No videos in response');
            return;
        }

        // Videos render karo
        renderVideos(videosData.items);
        totalVideos += videosData.items.length;
        console.log('Videos rendered:', videosData.items.length);
        updateFetchInfo();

        // Next page token save karo
        nextPageToken = videosData.nextPageToken || null;
        
        if (!nextPageToken) {
            allVideosLoaded = true;
            console.log('No more pages, all videos loaded');
            showToast(`✅ Total ${totalVideos} videos loaded!`, 'success');
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        } else {
            console.log('More videos available, next token:', nextPageToken);
            if (loadMoreContainer) loadMoreContainer.style.display = 'block';
        }

    } catch (error) {
        console.error('Error in loadMoreVideos:', error);
        showToast('❌ Error loading videos: ' + error.message, 'error');
    }
}

// Render Videos
function renderVideos(items) {
    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        console.error('Video grid element not found!');
        return;
    }

    console.log('Rendering', items.length, 'videos');
    items.forEach((item, index) => {
        try {
            const videoId = item.snippet.resourceId.videoId;
            const title = item.snippet.title;
            const thumbnail = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url;
            const publishedAt = new Date(item.snippet.publishedAt);
            const timeAgo = getTimeAgo(publishedAt);
            const channelTitle = item.snippet.channelTitle;

            const card = document.createElement('div');
            card.className = 'video-card';
            card.onclick = () => openVideoModal(videoId, title, channelTitle, item.snippet.description, publishedAt);
            
            card.innerHTML = `
                <div class="video-thumbnail">
                    <img src="${thumbnail}" alt="${title}" onerror="this.src='https://via.placeholder.com/320x180?text=No+Thumbnail'">
                    <div class="play-overlay">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="video-duration">NEW</div>
                </div>
                <div class="video-info">
                    <div class="channel-avatar-small">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="video-details-small">
                        <div class="video-title">${title}</div>
                        <div class="video-meta">
                            ${channelTitle}<br>
                            ${timeAgo}
                        </div>
                    </div>
                </div>
            `;
            videoGrid.appendChild(card);
            console.log(`Video ${index + 1} rendered:`, title.substring(0, 50));
        } catch (err) {
            console.error('Error rendering video:', err, item);
        }
    });
}

// Helper Functions
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'Just now';
}

function showStatus(message, type) {
    const statusMsg = document.getElementById('statusMessage');
    if (statusMsg) {
        statusMsg.innerHTML = message;
        statusMsg.className = 'status-message ' + type;
        statusMsg.style.display = 'block';
    }
}

function hideLoading() {
    const loadingAnimation = document.getElementById('loadingAnimation');
    if (loadingAnimation) loadingAnimation.style.display = 'none';
}

function updateFetchInfo() {
    const lastFetchEl = document.getElementById('lastFetch');
    const videoCountEl = document.getElementById('videoCount');
    
    if (lastFetchEl && lastFetchTime) {
        lastFetchEl.textContent = 'Last fetch: ' + lastFetchTime.toLocaleTimeString();
    }
    
    if (videoCountEl) {
        videoCountEl.textContent = 'Total videos: ' + totalVideos;
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        
        setTimeout(() => {
            toast.className = 'toast';        }, 3000);
    }
}

// Auto Fetch Functions
function startAutoFetch() {
    // Har 5 minute me auto fetch
    autoFetchInterval = setInterval(() => {
        console.log('Auto-fetch triggered');
        fetchVideos();
        showToast('🔄 New videos check kar rahe hain...', 'info');
    }, 300000); // 5 minutes
    
    console.log('Auto-fetch started (every 5 minutes)');
}

function stopAutoFetch() {
    if (autoFetchInterval) {
        clearInterval(autoFetchInterval);
        autoFetchInterval = null;
        console.log('Auto-fetch stopped');
    }
}

function toggleAutoFetch() {
    const statusEl = document.getElementById('autoFetchStatus');
    
    if (autoFetchInterval) {
        stopAutoFetch();
        if (statusEl) statusEl.textContent = 'OFF';
        showToast('⏸️ Auto-fetch band ho gaya', 'info');
    } else {
        startAutoFetch();
        if (statusEl) statusEl.textContent = 'ON';
        showToast('▶️ Auto-fetch shuru ho gaya', 'success');
    }
}

function autoRefresh() {
    const refreshIcon = document.getElementById('refreshIcon');
    if (refreshIcon) refreshIcon.classList.add('fa-spin');
    
    fetchVideos();
    
    setTimeout(() => {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
    }, 2000);
}

// Load Specific Channelfunction loadChannel(handle) {
    const channelInput = document.getElementById('channelInput');
    if (channelInput) {
        channelInput.value = handle;
        fetchVideos();
    }
}

function fetchTrending() {
    showToast('🔥 Trending videos feature jald aa raha hai!', 'info');
}

function showAddChannel() {
    const channel = prompt('Channel ka @handle ya URL dalein:');
    if (channel) {
        loadChannel(channel);
    }
}

// Video Modal Functions
function openVideoModal(videoId, title, channelTitle, description, publishedAt) {
    console.log('Opening video modal:', videoId);
    
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    if (!modal || !player) {
        console.error('Modal or player element not found!');
        return;
    }
    
    const titleEl = document.getElementById('videoTitle');
    const channelNameEl = document.getElementById('channelName');
    const channelSubsEl = document.getElementById('channelSubs');
    const videoDescEl = document.getElementById('videoDescription');
    const videoDateEl = document.getElementById('videoDate');
    const videoViewsEl = document.getElementById('videoViews');
    
    if (titleEl) titleEl.textContent = title;
    if (channelNameEl) channelNameEl.textContent = channelTitle;
    if (channelSubsEl) channelSubsEl.textContent = 'Subscribe karke support karein';
    if (videoDescEl) videoDescEl.textContent = description || 'No description available';
    if (videoDateEl) videoDateEl.textContent = `Published on ${publishedAt.toLocaleDateString()}`;
    if (videoViewsEl) videoViewsEl.textContent = 'Views';
    
    // YouTube embed player
    player.innerHTML = `
        <iframe 
            width="100%" 
            height="100%"             src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    console.log('Closing video modal');
    
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    if (player) player.innerHTML = '';
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function likeVideo() {
    showToast('👍 Video liked!', 'success');
}

function shareVideo() {
    const title = document.getElementById('videoTitle').textContent;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            text: 'Check out this video on TRT CHANNEL',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        showToast('📋 Link copied to clipboard!', 'success');
    }
}

function downloadVideo() {
    showToast('⬇️ Download feature jald aa raha hai!', 'info');
}

// UI Toggle Functions
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const icon = document.getElementById('themeIcon');    
    if (document.body.classList.contains('light-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar) sidebar.classList.toggle('collapsed');
    if (mainContent) mainContent.classList.toggle('expanded');
}

// ESC key se modal close karo
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideoModal();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (autoFetchInterval) {
        clearInterval(autoFetchInterval);
    }
});
