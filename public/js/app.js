// ⚠️ Apne Worker ka URL yahan dalein
const WORKER_URL = 'https://trt-channel-api.YOUR_SUBDOMAIN.workers.dev';

let currentPlaylistId = null;
let nextPageToken = null;
let allVideosLoaded = false;
let currentChannelData = null;

// Page load hone par automatically videos load karo
window.addEventListener('DOMContentLoaded', () => {
    // Default channel set karo
    document.getElementById('channelInput').value = '@kurulusosmanurduatv';
    loadChannelVideos();
    
    // Theme load karo
    loadTheme();
});

// Theme toggle
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
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Channel videos load karoasync function loadChannelVideos() {
    const input = document.getElementById('channelInput').value.trim();
    const statusMsg = document.getElementById('statusMessage');
    const videoGrid = document.getElementById('videoGrid');
    
    // Reset
    videoGrid.innerHTML = '';
    nextPageToken = null;
    allVideosLoaded = false;
    currentPlaylistId = null;
    
    statusMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Channel search kar rahe hain...';

    if (!input) {
        statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please enter a valid URL!';
        return;
    }

    try {
        // Channel ID fetch karna
        let channelEndpoint = `${WORKER_URL}/channels?`;
        
        if (input.includes('@')) {
            const handle = input.match(/@([a-zA-Z0-9_\-\.]+)/)[1];
            channelEndpoint += `handle=${handle}`;
        } else if (input.includes('/channel/')) {
            const channelId = input.match(/\/channel\/([a-zA-Z0-9_\-]+)/)[1];
            channelEndpoint += `id=${channelId}`;
        } else {
            statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid format!';
            return;
        }

        const channelRes = await fetch(channelEndpoint);
        const channelData = await channelRes.json();

        if (!channelData.items || channelData.items.length === 0) {
            statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Channel not found!';
            return;
        }

        currentChannelData = channelData.items[0];
        const channelTitle = currentChannelData.snippet.title;
        currentPlaylistId = currentChannelData.contentDetails.relatedPlaylists.uploads;

        statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> <strong>${channelTitle}</strong> ki videos load ho rahi hain...`;

        // Videos load karo
        await loadMoreVideos();
    } catch (error) {
        statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error: ' + error.message;
        console.error(error);
    }
}

// More videos load karo
async function loadMoreVideos() {
    const statusMsg = document.getElementById('statusMessage');
    const videoGrid = document.getElementById('videoGrid');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    if (allVideosLoaded) {
        statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> Saari videos load ho chuki hain!';
        loadMoreContainer.style.display = 'none';
        return;
    }

    try {
        let videosUrl = `${WORKER_URL}/playlist-items?playlistId=${currentPlaylistId}&maxResults=50`;
        
        if (nextPageToken) {
            videosUrl += `&pageToken=${nextPageToken}`;
        }

        const videosRes = await fetch(videosUrl);
        const videosData = await videosRes.json();

        if (videosData.items.length === 0) {
            statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> No videos found!';
            return;
        }

        // Videos render karo
        renderVideos(videosData.items);

        // Next page token save karo
        nextPageToken = videosData.nextPageToken || null;
        
        if (!nextPageToken) {
            allVideosLoaded = true;
            statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> Total ${videoGrid.children.length} videos loaded!`;
            loadMoreContainer.style.display = 'none';
        } else {
            statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> ${videoGrid.children.length} videos loaded`;
            loadMoreContainer.style.display = 'block';
        }

    } catch (error) {
        statusMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error: ' + error.message;        console.error(error);
    }
}

// Videos render karo
function renderVideos(items) {
    const videoGrid = document.getElementById('videoGrid');

    items.forEach(item => {
        const videoId = item.snippet.resourceId.videoId;
        const title = item.snippet.title;
        const thumbnail = item.snippet.thumbnails.high.url;
        const publishedAt = new Date(item.snippet.publishedAt);
        const timeAgo = getTimeAgo(publishedAt);
        const channelTitle = item.snippet.channelTitle;

        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => openVideoModal(videoId, title, channelTitle, item.snippet.description, publishedAt);
        
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnail}" alt="${title}">
                <div class="play-overlay">
                    <i class="fas fa-play-circle"></i>
                </div>
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
    });
}

// Time ago calculate karo
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,        month: 2592000,
        week: 604800,
        day: 86400,
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

// Video modal open karo
function openVideoModal(videoId, title, channelTitle, description, publishedAt) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    
    document.getElementById('videoTitle').textContent = title;
    document.getElementById('channelName').textContent = channelTitle;
    document.getElementById('channelSubs').textContent = 'Subscribe karke support karein';
    document.getElementById('videoDescription').textContent = description || 'No description available';
    document.getElementById('videoDate').textContent = `Published on ${publishedAt.toLocaleDateString()}`;
    document.getElementById('videoViews').textContent = 'Views';
    
    // YouTube embed player
    player.innerHTML = `
        <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Video modal close karo
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
        player.innerHTML = '';
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Share video
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
        alert('Link copied to clipboard!');
    }
}

// ESC key se modal close karo
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideoModal();
    }
});
