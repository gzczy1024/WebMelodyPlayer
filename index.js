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
const audioName = document.querySelector(".name");
const leftContent = document.querySelector(".leftcontent");
const rightContent = document.querySelector(".rightcontent");

let bgImg = new Image();
let playing = false;
let isDragging = false;
let lrcData;
let lyrics = [];
let lyricsElement = document.querySelector(".lyrics");
let reader;

svgcontainer.addEventListener("click", async () => {
    audioFileInput.click();
});

audioPlayer.addEventListener("loadedmetadata", () => {
    endTime.textContent = `-${formatTime(audioPlayer.duration)}`;
    setTimeout(() => {
        playBtn.click();
    }, 100);
});

audioFileInput.addEventListener("change", (event) => {
    const files = event.target.files;
    disableLyric();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileURL = URL.createObjectURL(file);
        console.log(file.name);

        if (file.type.startsWith('image/')) {
            bgImg.src = fileURL;
        } else if (file.type.startsWith('audio/')) {
            audioPlayer.src = fileURL;

            let filename = file.name.split('.')[0];
            if (filename.length > 15) {
                filename = filename.substring(0, 15) + "...";
            }
            audioName.textContent = filename;
        } else if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith(".lrc")) {
            reader = new FileReader();
            reader.onload = function(e) {
                enableLyric();
                lrcData = e.target.result;
                lyrics = parseLrc(lrcData);
                lyricsElement.innerHTML = ""
                lyricsElement = document.querySelector(".lyrics");
                /*lyricsElement.innerHTML = lyrics.map(line => `
    <div class="lowlight" data-time="${line.time}">
        ${line.originalText}<br>
        ${line.translation}<br>
        ${line.romaji}
    </div>
`).join('');*/
                for(let im = 0;im <lyrics.length;im++){
                    let tly = `<div class="lowlight" data-time="${lyrics[im].time}">${lyrics[im].originalText}`
                    if(lyrics[im].translation !== ""){
                        tly += `<br>${lyrics[im].translation}`
                    }
                    if(lyrics[im].romaji !== ""){
                        tly += `<br>${lyrics[im].romaji}`
                    }
                    tly += `</div>`
                    lyricsElement.innerHTML += tly
                }
                lyricsElement.innerHTML += "<div><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br></div>"
                document.querySelectorAll('.lyrics > div').forEach(lyric => {
                    lyric.addEventListener('click', () => {
                        const time = parseFloat(lyric.dataset.time);
                        audioPlayer.currentTime = time;
                        if (!playing) {
                            playBtn.click();
                        }
                    });
                });
            };
            reader.readAsText(file);
        }
    }
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

playBtn.addEventListener("click", () => {
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
});

function updateProgress(event) {
    
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = event.clientX - rect.left;
    const progressBarWidth = rect.width;
    const percentage = (clickPosition / progressBarWidth) * 100;
    process.style.width = `${percentage}%`;
    audioPlayer.currentTime = (percentage / 100) * audioPlayer.duration;

    if (!playing) {
        playBtn.click();
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
    console.log('Scrolling started');
    document.querySelectorAll('.lyrics > *').forEach((line, index) => {
        line.style.filter = "none";
    })
        
  }

  // 清除之前的定时器
  clearTimeout(scrollTimeout);

  // 设置新的定时器
  scrollTimeout = setTimeout(() => {
    isScrolling = 0;
    console.log('Scrolling stopped');
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
        console.log(isScrolling);
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
    svgcontainer.style.background = `url(${bgImg.src}`;

    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    tempCanvas.width = 100
    tempCanvas.height = 100 * (bgImg.height / bgImg.width)

    tempCtx.drawImage(bgImg, 0, 0, tempCanvas.width, tempCanvas.height)
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

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
}

