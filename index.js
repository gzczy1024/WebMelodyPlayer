const svgcontainer = document.querySelector(".svgcontainer");
const audioFileInput = document.querySelector(".audiofile");
const audioPlayer = document.querySelector(".player");
const progressBar = document.querySelector(".processbar");
const process = document.querySelector(".process");
const startTime = document.querySelector(".start");
const endTime = document.querySelector(".end");
const justSvg = document.querySelector(".svg");
const playBtn = document.querySelector(".play");
const pauseBtn = document.querySelector(".pause");
const playContainer = document.querySelector(".play-container");
const audioName = document.querySelector(".name");
const leftContent = document.querySelector(".leftcontent");
const rightContent = document.querySelector(".rightcontent");
const toggleListButton = document.getElementById('toggleList');
const songListContainer = document.getElementById('songList');

let isListCollapsed = true;
let bgImg = new Image();
let playing = false;
let isDragging = false;
let lrcData;
let lyrics = [];
let lyricsElement = document.querySelector(".lyrics");
let reader;
document.querySelector('.play').style.display = 'block';
document.querySelector('.pause').style.display = 'none';

svgcontainer.addEventListener("click", async () => {
    audioFileInput.click();
});

audioPlayer.addEventListener("loadedmetadata", () => {
    endTime.textContent = `-${formatTime(audioPlayer.duration)}`;
    /*setTimeout(() => {
        playBtn.click();
    }, 100);*/
});




function disableLyric() {
    rightContent.style.display = "none";
    leftContent.style.paddingLeft = "none";
}

function enableLyric() {
    rightContent.style.display = "";
    leftContent.style.paddingLeft = "";
}

function fetchLrcFile(filename) {
    return new Promise((resolve, reject) => {
        const lrcFileUrl = `${filename}`;
        fetch(lrcFileUrl)
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    reject("No such lrc file");
                    disableLyric();
                }
            })
            .then(lrcData => resolve(lrcData))
            .catch(error => reject(error));
    });
}

audioPlayer.addEventListener("timeupdate", () => {
    if (audioPlayer.duration) {
        process.style.width = `${(audioPlayer.currentTime / audioPlayer.duration) * 100}%`;
        startTime.textContent = formatTime(audioPlayer.currentTime);
        endTime.textContent = `-${formatTime(audioPlayer.duration - audioPlayer.currentTime)}`;
    }
});

progressBar.addEventListener("mousedown", (event) => {
    if (Number.isNaN(audioPlayer.duration)) {
        return;
    }
    isDragging = true;
    updateProgress(event);
});

document.addEventListener("mousemove", (event) => {
    if (isDragging) {
        updateProgress(event);
    }
});

document.addEventListener("mouseup", () => {
    isDragging = false;
});

/*playBtn.addEventListener("click", () => {
    if (Number.isNaN(audioPlayer.duration)) {
        return;
    }
    playing = true;
    audioPlayer.play();
    pauseBtn.style.display = "block";
    playBtn.style.display = "none";
});

pauseBtn.addEventListener("click", () => {
    playing = false;
    audioPlayer.pause();
    pauseBtn.style.display = "none";
    playBtn.style.display = "block";
});*/
// 修改播放按钮点击事件
document.querySelector('.play-container').addEventListener('click', () => {
    if (Number.isNaN(audioPlayer.duration)) return;
    if (playing) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }
    /*if (playing) {
        audioPlayer.pause();
        document.querySelector('.play').style.display = 'block';
        document.querySelector('.pause').style.display = 'none';
        playing = false;
    } else {
        audioPlayer.play();
        document.querySelector('.play').style.display = 'none';
        document.querySelector('.pause').style.display = 'block';
        playing = true;
    }*/
    
});


function updateProgress(event) {
    
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const progressBarWidth = rect.width;
    const percentage = (clickPosition / progressBarWidth) * 100;
    process.style.width = `${percentage}%`;
    audioPlayer.currentTime = (percentage / 100) * audioPlayer.duration;

    if (!playing) {
        playContainer.click();
    }
}

function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function parseLrc(lrcText) {
    const lines = lrcText.trim().split('\n');
    const timeGroups = {};

    lines.forEach(line => {
        const timeMatch = line.match(/\[(\d{2,3}):(\d{2})(?:\.(\d{1,3}))?\]/);
        if (timeMatch) {
            const minutes = parseInt(timeMatch[1], 10);
            const seconds = parseInt(timeMatch[2], 10);
            const msPart = timeMatch[3] || '';
            const paddedMs = msPart.padEnd(3, '0').slice(0, 3);
            const milliseconds = parseInt(paddedMs, 10);
            const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;

            const text = line.replace(timeMatch[0], '').trim();
            if (!timeGroups[timeInSeconds]) {
                timeGroups[timeInSeconds] = [];
            }
            timeGroups[timeInSeconds].push(text);
        }
    });

    return Object.keys(timeGroups)
        .sort((a, b) => parseFloat(a) - parseFloat(b))
        .map(timeStr => {
            const texts = timeGroups[timeStr];
            return {
                time: parseFloat(timeStr),
                originalText: texts[0] || '',
                translation: texts[1] || '',
                romaji: texts[2] || ''
            };
        });
}

let isScrolling = 0;
let scrollTimeout;

window.addEventListener('wheel', handleScroll);

function handleScroll() {
  // 更新滚动状态（如果尚未设置）
  if (isScrolling === 0) {
    isScrolling = 1;
    
    document.querySelectorAll('.lyrics > *').forEach((line, index) => {
        line.style.filter = "none";
    })
        
  }

  // 清除之前的定时器
  clearTimeout(scrollTimeout);

  // 设置新的定时器
  scrollTimeout = setTimeout(() => {
    isScrolling = 0;
    
  }, 3000);
}

// 可选：检测触摸屏滑动（移动端支持）
window.addEventListener('touchmove', handleScroll);

function updateLyrics() {
    const currentTime = audioPlayer.currentTime;
    const lyricLines = document.querySelectorAll('.lyrics > *');
    let activeIndex = 0;

    for (let i = 0; i < lyrics.length; i++) {
        if (currentTime >= lyrics[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    lyricLines.forEach((line, index) => {
        if (index === activeIndex) {
            line.classList.remove("lowlight");
            line.classList.add("highlight");
            line.style.filter = "none";
            line.style.marginLeft = "0";
        } else {
            line.classList.remove("highlight");
            line.classList.add("lowlight");
            if(isScrolling == 0){
                line.style.filter = `blur(${Math.abs(activeIndex - index) * 0.35}px)`;
            }
            line.style.marginLeft = `${Math.abs(activeIndex - index) * 1.25}px`;
        }
    });

    if (activeIndex >= 0) {
        const activeLine = lyricLines[activeIndex];
        
        if(isScrolling == 0){
            
            if (activeLine) {
                // 使用 scrollIntoView 方法滚动到当前活动的歌词行
                activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
    
    if (playing) {
        requestAnimationFrame(updateLyrics);
    }
}

audioPlayer.addEventListener('play', () => {
    requestAnimationFrame(updateLyrics);
});

window.addEventListener('resize', () => {
    lyricsElement.classList.add("noTransition");
    updateLyrics();
    lyricsElement.classList.remove("noTransition");
});

updateLyrics();

function getDominantColors(imageData, colorCount = 5) {
    const pixels = imageData.data
    const colorMap = {}
    const minColorDistance = 45

    for (let i = 0; i < pixels.length; i += 4 * 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
        const key = `${r},${g},${b}`

        let isUnique = true
        for (const existingColor of Object.keys(colorMap)) {
            const [er, eg, eb] = existingColor.split(',').map(Number)
            const distance = Math.sqrt((r - er) ** 2 + (g - eg) ** 2 + (b - eb) ** 2)
            if (distance < minColorDistance) {
                isUnique = false
                break
            }
        }

        if (isUnique) {
            colorMap[key] = (colorMap[key] || 0) + 1
        }
    }

    return Object.entries(colorMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, colorCount)
        .map(([color]) => {
            const [r, g, b] = color.split(',')
            return `rgba(${r}, ${g}, ${b}, 0.9)`
        })
}

bgImg.onload = () => {
    justSvg.style.display = "none";
    svgcontainer.style.background = `url(${bgImg.src}) center/cover no-repeat`; // 确保背景图片居中并完整显示

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = 100;
    tempCanvas.height = 100 * (bgImg.height / bgImg.width);

    tempCtx.drawImage(bgImg, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    let colors = getDominantColors(imageData);
    document.body.style.setProperty('--background', colors[0]);
    document.body.style.setProperty('--color1', colors[0]);
    document.body.style.setProperty('--color2', colors[1]);
    document.body.style.setProperty('--color3', colors[2]);
    document.body.style.setProperty('--color4', colors[3]);
    document.body.style.setProperty('--color5', colors[4]);
    document.body.style.setProperty('--color1-rgba', colors[0].replace("0.9", "0"));
    document.body.style.setProperty('--color2-rgba', colors[1].replace("0.9", "0"));
    document.body.style.setProperty('--color3-rgba', colors[2].replace("0.9", "0"));
    document.body.style.setProperty('--color4-rgba', colors[3].replace("0.9", "0"));
    document.body.style.setProperty('--color5-rgba', colors[4].replace("0.9", "0"));
};

// 新增全局变量
let songs = [];
let currentSongIndex = -1;

// 修改文件选择事件处理
audioFileInput.addEventListener("change", (event) => {
    const files = event.target.files;
    const fileGroups = {};

    // 按文件名分组
    Array.from(files).forEach(file => {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        if (!fileGroups[baseName]) {
            fileGroups[baseName] = {};
        }
        if (file.type.startsWith('audio/')) {
            fileGroups[baseName].audio = file;
        } else if (file.name.endsWith('.lrc')) {
            fileGroups[baseName].lrc = file;
        } else if (file.type.startsWith('image/')) {
            fileGroups[baseName].image = file;
        }
    });

    // 构建歌曲列表
    songs = Object.entries(fileGroups).map(([name, files]) => ({
        name,
        audio: files.audio,
        lrc: files.lrc,
        image: files.image
    }));
    document.getElementById("menu-btn").click()
    // 渲染歌曲列表
    renderSongList(songs);
});

// 新增歌曲列表渲染函数
function renderSongList(songsArray) {
    const songList = document.getElementById('songList');
    songList.innerHTML = songsArray.map((song, index) => `
        <a href="#" class="list-group-item list-group-item-action" data-index="${index}">
            ${song.name}
            ${song.image ? '<span class="badge bg-primary ms-2" style="float:right">封面</span>' : ''}
            ${song.lrc ? '<span class="badge bg-success ms-1" style="float:right">歌词</span>' : ''}
        </a>
    `).join('');

    // 添加点击事件
    document.querySelectorAll('#songList .list-group-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const index = parseInt(e.currentTarget.dataset.index);
            document.getElementById("modal-close").click()
            loadSong(index);
        });
    });
    
    //toggleListButton.click()
}

// 新增歌曲加载函数
// 新增搜索功能
document.getElementById('searchInput').addEventListener('input', function(e) {
    if(e.target.value != ""){
        const searchTerm = e.target.value.toLowerCase();
        const filtered = songs.filter(song => 
            song.name.toLowerCase().includes(searchTerm)
        );
        renderSongList(filtered);
    }else{
        renderSongList(songs);
    }
});

function updateLyricsDisplay() {
    lyricsElement.innerHTML = "";
    lyrics.forEach(line => {
        const lyricDiv = document.createElement('div');
        lyricDiv.className = 'lowlight';
        lyricDiv.dataset.time = line.time;
        lyricDiv.innerHTML = line.originalText;
        if (line.translation) {
            lyricDiv.innerHTML += `<br>${line.translation}`;
        }
        if (line.romaji) {
            lyricDiv.innerHTML += `<br>${line.romaji}`;
        }
        lyricsElement.appendChild(lyricDiv);
    });
    lyricsElement.innerHTML += "<div><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br></div>";
}

/*function loadSong(index) {
    if (index < 0 || index >= songs.length) return;
    currentSongIndex = index;
    const song = songs[index];
    // 重置播放进度
    audioPlayer.pause()
    audioPlayer.currentTime = 0; // 新增的进度重置代码
    process.style.width = '0%'; // 重置进度条
    // 加载音频
    audioPlayer.src = URL.createObjectURL(song.audio);
    audioName.textContent = song.name;
    // 保持播放按钮状态正确
    document.querySelector('.play').style.display = 'none';
    document.querySelector('.pause').style.display = 'block';
    

    

    // 加载音频
    audioPlayer.src = URL.createObjectURL(song.audio);
    audioName.textContent = song.name;
    audioPlayer.play();
    
    // 加载歌词
    if (song.lrc) {
        const reader = new FileReader();
        reader.onload = function(e) {
            lyrics = parseLrc(e.target.result);
            updateLyricsDisplay();
        };
        reader.readAsText(song.lrc);
    }

    // 加载封面
    if (song.image) {
        bgImg.src = URL.createObjectURL(song.image);
    }

    // 自动播放
    
    //playing =true;
}
*/
function loadSong(index) {
    if (index < 0 || index >= songs.length) return;
    currentSongIndex = index;
    const song = songs[index];
    // 重置播放器状态
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    process.style.width = '0%';
    // 设置新音频源
    audioPlayer.src = URL.createObjectURL(song.audio);
    audioName.textContent = song.name;
    // 加载歌词
    if (song.lrc) {
        const reader = new FileReader();
        reader.onload = function(e) {
            lyrics = parseLrc(e.target.result);
            updateLyricsDisplay();
        };
        reader.readAsText(song.lrc);
    }
    // 加载封面
    if (song.image) {
        bgImg.style.display="block";
        bgImg.src = URL.createObjectURL(song.image);
    }else{
        bgImg.style.display="none"
    }
    // 播放音频（确保在 canplay 事件后）
    audioPlayer.addEventListener('canplay', () => {
        audioPlayer.play().catch(error => {
            console.error('播放失败:', error);
        });
    }, { once: true });

    setTimeout(() => {
        calculateOptimalPadding();
        updateNameScroll();
    }, 300);
}

function calculateOptimalPadding() {
    const container = document.querySelector('.name-container');
    const name = document.querySelector('.name');
    
    // 根据文本长度动态调整间距
    const textRatio = name.scrollWidth / container.offsetWidth;
    if (textRatio > 3) { // 超长文本
        container.style.padding = '0 5px 0 5px';
        name.style.animationDuration = `${8 * textRatio}s`; // 动态调整速度
    } else if (textRatio > 2) { // 较长文本
        container.style.padding = '0 5px 0 5px';
    } else { // 正常长度
        container.style.padding = '0 15px 0 15px';
    }
}

function updateNameScroll() {
    const nameElement = document.querySelector('.name');
    const container = document.querySelector('.name-container');
    
    // 重置样式
    nameElement.style.animation = 'none';
    nameElement.style.transform = 'translateX(0)';
    void nameElement.offsetWidth; // 触发重绘
    
    // 精确计算
    const textWidth = nameElement.scrollWidth;
    const containerWidth = container.offsetWidth;
    
    // 切换模式
    if (textWidth > containerWidth) {
        nameElement.classList.add('scroll');
        
        nameElement.style.animation = 'marquee 8s linear infinite';
    } else {
        nameElement.classList.remove('scroll');
        nameElement.style.textAlign = 'center'; // 强制居中
    }
    // 用 JS 获取宽度并赋值给 CSS 变量
    

}


// 折叠按钮逻辑

toggleListButton.addEventListener('click', () => {
    
    if (isListCollapsed) {
        songListContainer.style.display = 'block';
        toggleListButton.innerHTML = '<span>收起歌曲列表</span>';
    } else {
        songListContainer.style.display = 'none';
        toggleListButton.innerHTML = '<span>展开歌曲列表</span>';
    }
    isListCollapsed = !isListCollapsed;
});



// 播放模式切换逻辑
//const playModeButton = document.getElementById('playMode');

//let playMode = 0;
/*
playModeButton.addEventListener('click', () => {
    playMode = (playMode + 1) % 3;
    switch (playMode) {
        case 0:
            playModeButton.innerHTML = '<span>全部循环</span>';
            break;
        case 1:
            playModeButton.innerHTML = '<span>单曲循环</span>';
            break;
        case 2:
            playModeButton.innerHTML = '<span>随机播放</span>';
            break;
    }
});*/

// 歌曲播放结束逻辑
audioPlayer.addEventListener('ended', () => {
    switch (playMode) {
        case 0:
            loadNextSong();
            break;
        case 1:
            audioPlayer.currentTime = 0;
            audioPlayer.play();
            break;
        case 2:
            loadRandomSong();
            break;
    }
});

// 加载下一首歌曲
function loadNextSong() {
    if (currentSongIndex < songs.length - 1) {
        loadSong(currentSongIndex + 1);
    } else {
        loadSong(0);
    }
}

// 加载随机歌曲
function loadRandomSong() {
    const randomIndex = Math.floor(Math.random() * songs.length);
    loadSong(randomIndex);
}

// 添加新的按钮事件监听
document.querySelector('.prev').addEventListener('click', loadPreviousSong);
document.querySelector('.next').addEventListener('click', loadNextSong);

// 修改播放模式切换逻辑
const modeButton = document.getElementById('playMode');
const Icon0 = document.getElementById('playModeIcon0');
const Icon1 = document.getElementById('playModeIcon1');
const Icon2 = document.getElementById('playModeIcon2');
let playMode = 0;

// 播放模式图标配置
const modeIcons = ["fas fa-repeat-alt","fas fa-repeat-1-alt","fas fa-random"];

modeButton.addEventListener('click', () => {
    playMode = (playMode + 1) % 3;
    Icon0.style.display = 'none';
    Icon1.style.display = 'none';
    Icon2.style.display = 'none';
    console.log(playMode)
    switch(playMode){
        case 0:
            Icon0.style.display = 'block';
            break;
        case 1:
            Icon1.style.display = 'block';
            break;
        case 2:
            Icon2.style.display = 'block';
            break;
    }
});

// 新增歌曲切换函数
function loadPreviousSong() {
    if (playMode === 2) { // 随机模式
        loadRandomSong();
    } else if (currentSongIndex > 0) {
        loadSong(currentSongIndex - 1);
    } else {
        loadSong(songs.length - 1);
    }
}

function loadNextSong() {
    if (playMode === 2) { // 随机模式
        loadRandomSong();
    } else if (currentSongIndex < songs.length - 1) {
        loadSong(currentSongIndex + 1);
    } else {
        loadSong(0);
    }
}

// index.js 中添加音频事件监听器
audioPlayer.addEventListener('play', () => {
    document.querySelector('.play').style.display = 'none';
    document.querySelector('.pause').style.display = 'block';
    playing = true;
});
audioPlayer.addEventListener('pause', () => {
    document.querySelector('.play').style.display = 'block';
    document.querySelector('.pause').style.display = 'none';
    playing = false;
});
