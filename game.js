class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.resizeCanvas();
    window.addEvenListener('resize', () => this.resizeCanvas());

    this.ctx.imageSmoothingEnabled = false;

    this.worldWidth = 5000;
    this.worldHeight = 5000;
    this.spawningEnemies = [];
        
        this.camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
        
        this.player = {
            x: this.worldWidth / 2,
            y: this.worldHeight / 2,
            size: 28,
            speed: 5,
            health: 100,
            maxHealth: 100,
            invincibleTimer: 0,
            walkBob: 0
        };
        
        this.currentWeapon = 'mg';
        
        this.mgAmmo = {
            current: 30,
            total: 120,
            maxMag: 30,
            reloading: false,
            reloadTimer: 0,
            reloadTime: 167
        };
        
        this.shotgunAmmo = {
            current: 6,
            total: 24,
            maxMag: 6,
            reloading: false,
            reloadTimer: 0,
            reloadTime: 120
        };
        
        this.ammo = this.mgAmmo;
        
        this.shooting = false;
        this.shootCooldown = 0;
        this.mgShootDelay = 5;
        this.shotgunShootDelay = 15;
        this.bullets = [];
        this.bulletSpeed = 15;
        this.muzzleFlash = { active: false, timer: 0 };
        
        this.molotovs = 3;
        this.molotovCooldown = 0;
        this.molotovCooldownMax = 120;
        this.fireZones = [];
        this.molotovProjectiles = [];
        
        this.damageFlashTimer = 0;
        this.hitMarkerTimer = 0;
        this.screenShake = { active: false, intensity: 0, timer: 0 };
        this.lowAmmoWarningTimer = 0;
        this.lowHealthWarningTimer = 0;
        this.recoilAngle = 0;
        this.recoilTimer = 0;
        
        this.fires = [];
        this.smokeParticles = [];
        this.fogIntensity = 0.4;
        
        this.mouseWorld = { x: 0, y: 0 };
        this.mouseScreen = { x: 0, y: 0 };
        this.bloodSplatters = [];
        
        this.enemies = [];
        this.enemyCount = 18;
        
        this.trees = [];
        this.treeCount = 60;
        this.ponds = [];
        this.pondCount = 8;
        this.structures = [];
        this.ammoPickups = [];
        this.molotovPickups = [];
        this.groundMap = [];
        this.groundSize = 32;
        this.decorations = [];
        this.craters = [];
        this.particles = [];
        this.lastClickTime = 0;
        this.knockbackIntensity = 0;
  
        this.keys = { w: false, s: false, a: false, d: false };
        
        this.wave = 1;
        this.enemiesToSpawn = 5;  
        this.enemiesRemaining = 0;
        this.waveInProgress = false;
        this.waveCooldown = 0;
        this.waveMessage = "";
        this.waveMessageTimer = 0;
        this.bossSpawned = false;
        this.waveSpawningComplete = true;

        this.paused = false;
        this.minimapSize = 180;
        this.minimapZoom = 0.06;
        this.score = 0;
        this.kills = 0;
        this.gameOver = false;
        
        // Floating damage numbers
        this.floatingNumbers = [];
        
        // Tutorial
        this.tutorialSeen = localStorage.getItem('tutorialSeen') === 'true';
        this.showTutorial = !this.tutorialSeen;
        
        this.healthFill = document.getElementById('healthFill');
        this.healthValue = document.getElementById('healthValue');
        this.ammoFill = document.getElementById('ammoFill');
        this.ammoCurrent = document.getElementById('ammoCurrent');
        this.ammoTotal = document.getElementById('ammoTotal');
        this.scoreValue = document.getElementById('scoreValue');
        this.killsValue = document.getElementById('killsValue');
        this.reloadCircular = document.getElementById('reloadCircular');
        this.reloadProgressCircle = document.getElementById('reloadProgressCircle');
        this.lowAmmoWarning = document.getElementById('lowAmmoWarning');
        this.lowHealthWarning = document.getElementById('lowHealthWarning');
        this.damageFlash = document.getElementById('damageFlash');
        this.hitMarker = document.getElementById('hitMarker');
        this.fogOverlay = document.getElementById('fogOverlay');
        
        this.crosshair = document.getElementById('crosshair');
        this.addCrosshairDot();
        
        this.audioContext = null;
        this.soundsEnabled = true;
        this.gunshotSound = null;
        this.reloadSound = null;
        this.clickSound = null;
        
        this.setupInput();
        this.generateGroundMap();
        this.generateChaoticWorld();
        this.generateFiresAndSmoke();
        this.startWave();
        this.spawnAmmoPickups();
        this.spawnMolotovPickups();
        this.setupAudio();
        this.updateUI();
        this.gameLoop();
    }
    setupAudio() {
        document.body.addEventListener('click', () => {
            if (!this.audioContext) {
                this.initAudio();
                this.playSound('pickup', 0.1);
            }
        }, { once: true });
    }
    
    initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.loadGunshotSound();
    }

    loadGunshotSound() {
        this.gunshotSound = new Audio();
        this.gunshotSound.src = '415912__okieactor__heathers-gunshot-effect2.wav';
        this.gunshotSound.preload = 'auto';
        this.gunshotSound.onerror = () => { this.gunshotSound = null; };
        
        this.reloadSound = new Audio();
        this.reloadSound.src = '276964__gfl7__m4a1-or-m16-reload-sound.mp3';
        this.reloadSound.preload = 'auto';
        this.reloadSound.onerror = () => { this.reloadSound = null; };
        
        this.clickSound = new Audio();
        this.clickSound.src = '113636__edgardedition__click6.wav';
        this.clickSound.preload = 'auto';
        this.clickSound.onerror = () => { this.clickSound = null; };
    }
    
    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    playSound(type, volume = 0.3) {
        if (!this.audioContext || !this.soundsEnabled) return;
        this.resumeAudio();
        
        if (type === 'gunshot' && this.gunshotSound) {
            const clone = new Audio();
            clone.src = this.gunshotSound.src;
            clone.volume = volume;
            clone.play().catch(() => {});
            return;
        }
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        gain.gain.value = volume;
        
        switch(type) {
            case 'zombie':
                osc.frequency.value = 70 + Math.random() * 40;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.6);
                osc.type = 'sawtooth';
                break;
            case 'death':
                osc.frequency.value = 120;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.4);
                osc.type = 'square';
                break;
            case 'hit':
                osc.frequency.value = 300;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.15);
                osc.type = 'triangle';
                break;
            case 'pickup':
                osc.frequency.value = 800;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.2);
                osc.type = 'sine';
                break;
            case 'reload':
                osc.frequency.value = 400;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.3);
                osc.type = 'sine';
                break;
            case 'hurt':
                osc.frequency.value = 100;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.35);
                osc.type = 'sawtooth';
                break;
            case 'fire':
                osc.frequency.value = 50 + Math.random() * 30;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.5);
                osc.type = 'sine';
                break;
            case 'molotov':
                osc.frequency.value = 150;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.5);
                osc.type = 'sawtooth';
                break;
            case 'boss':
                osc.frequency.value = 60;
                gain.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.8);
                osc.type = 'sawtooth';
                break;
            default: return;
        }
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.4);
    }
    
    addCrosshairDot() {
        const dot = document.createElement('div');
        dot.className = 'dot';
        this.crosshair.appendChild(dot);
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    togglePause() {
        if (!this.gameOver) {
            this.paused = !this.paused;
        }
    }
    drawPauseMenu() {
        if (!this.paused) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffaa44';
        this.ctx.font = 'bold 48px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px "Share Tech Mono", monospace';
        this.ctx.fillText('Press [P] to Resume', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Press [R] to Reload', this.canvas.width / 2, this.canvas.height / 2 + 40);
        this.ctx.fillText('Press [F] to Throw Molotov', this.canvas.width / 2, this.canvas.height / 2 + 80);
        this.ctx.fillText('Scroll Wheel to Switch Weapons', this.canvas.width / 2, this.canvas.height / 2 + 120);
        
        this.ctx.fillStyle = '#ffaa44';
        this.ctx.font = '14px "Press Start 2P", monospace';
        this.ctx.fillText(`SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 180);
        this.ctx.fillText(`KILLS: ${this.kills}`, this.canvas.width / 2, this.canvas.height / 2 + 210);
        this.ctx.textAlign = 'left';
    }
    
    drawTutorial() {
        if (!this.showTutorial) return;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffaa44';
        this.ctx.font = 'bold 28px "Press Start 2P", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SURVIVAL GUIDE', this.canvas.width / 2, 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px "Share Tech Mono", monospace';
        const instructions = [
            'WASD - Move around',
            'Mouse - Aim',
            'Hold LMB - Shoot',
            'Scroll Wheel - Switch weapons',
            'R - Reload',
            'F - Throw Molotov',
            'P - Pause',
            '',
            'Kill zombies to progress waves',
            'Boss appears every 3 waves!',
            '',
            'Click anywhere to start'
        ];
        for (let i = 0; i < instructions.length; i++) {
            this.ctx.fillText(instructions[i], this.canvas.width / 2, 160 + i * 35);
        }
        
        this.ctx.textAlign = 'left';
    }
    
    closeTutorial() {
        this.showTutorial = false;
        localStorage.setItem('tutorialSeen', 'true');
    }
    
    drawMinimap() {
        const mapX = this.canvas.width - this.minimapSize - 20;
        const mapY = 20;
        const mapSize = this.minimapSize;
        const centerX = mapX + mapSize / 2;
        const centerY = mapY + mapSize / 2;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this.ctx.fillRect(mapX, mapY, mapSize, mapSize);
        this.ctx.strokeStyle = '#ffaa44';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mapX, mapY, mapSize, mapSize);
        
        const worldToMap = (worldX, worldY) => {
            const relativeX = (worldX - this.camera.x) * this.minimapZoom;
            const relativeY = (worldY - this.camera.y) * this.minimapZoom;
            return { x: centerX + relativeX, y: centerY + relativeY };
        };
        
        this.ctx.fillStyle = '#2d6a2c';
        for (let tree of this.trees) {
            const pos = worldToMap(tree.x, tree.y);
            if (pos.x > mapX && pos.x < mapX + mapSize && pos.y > mapY && pos.y < mapY + mapSize) {
                this.ctx.fillRect(pos.x - 1, pos.y - 1, 2, 2);
            }
        }
        
        this.ctx.fillStyle = '#6a5a4a';
        for (let struct of this.structures) {
            const pos = worldToMap(struct.x + struct.width/2, struct.y + struct.height/2);
            if (pos.x > mapX && pos.x < mapX + mapSize && pos.y > mapY && pos.y < mapY + mapSize) {
                this.ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            }
        }
        
        for (let enemy of this.enemies) {
            const pos = worldToMap(enemy.x, enemy.y);
            if (pos.x > mapX && pos.x < mapX + mapSize && pos.y > mapY && pos.y < mapY + mapSize) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 5 + Math.sin(Date.now() * 0.005) * 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        const playerPos = worldToMap(this.player.x + this.player.size/2, this.player.y + this.player.size/2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(playerPos.x, playerPos.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        const angle = Math.atan2(this.mouseWorld.y - this.player.y, this.mouseWorld.x - this.player.x);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(playerPos.x, playerPos.y);
        this.ctx.lineTo(playerPos.x + Math.cos(angle) * 6, playerPos.y + Math.sin(angle) * 6);
        this.ctx.stroke();
        
        for (let zone of this.fireZones) {
            const pos = worldToMap(zone.x, zone.y);
            if (pos.x > mapX && pos.x < mapX + mapSize && pos.y > mapY && pos.y < mapY + mapSize) {
                this.ctx.fillStyle = '#ff6600';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        for (let ammo of this.ammoPickups) {
            const pos = worldToMap(ammo.x, ammo.y);
            if (pos.x > mapX && pos.x < mapX + mapSize && pos.y > mapY && pos.y < mapY + mapSize) {
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            }
        }
        
        for (let pickup of this.molotovPickups) {
            const pos = worldToMap(pickup.x, pickup.y);
            if (pos.x > mapX && pos.x < mapX + mapSize && pos.y > mapY && pos.y < mapY + mapSize) {
                this.ctx.fillStyle = '#ff8800';
                this.ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
            }
        }
        
        this.ctx.fillStyle = '#ffaa44';
        this.ctx.font = '8px "Press Start 2P", monospace';
        this.ctx.fillText('RADAR', mapX + 5, mapY + 15);
    }
    switchWeapon(weapon) {
        if (weapon === 'mg' && this.currentWeapon !== 'mg') {
            this.currentWeapon = 'mg';
            this.ammo = this.mgAmmo;
            this.updateUI();
            const weaponIcon = document.getElementById('weaponIcon');
            if (weaponIcon) weaponIcon.textContent = '🔫';
        } else if (weapon === 'shotgun' && this.currentWeapon !== 'shotgun') {
            this.currentWeapon = 'shotgun';
            this.ammo = this.shotgunAmmo;
            this.updateUI();
            const weaponIcon = document.getElementById('weaponIcon');
            if (weaponIcon) weaponIcon.textContent = '🔫';
        }
    }
    
    generateGroundMap() {
        for (let x = 0; x < this.worldWidth; x += this.groundSize) {
            this.groundMap[x] = [];
            for (let y = 0; y < this.worldHeight; y += this.groundSize) {
                const chaosNoise = Math.sin(x * 0.003) * Math.cos(y * 0.003) + Math.sin(x * 0.01) * 0.3;
                if (chaosNoise > 0.6) this.groundMap[x][y] = { type: 'burned', variant: 0 };
                else if (chaosNoise > 0.3) this.groundMap[x][y] = { type: 'cobble', variant: Math.floor(Math.random() * 2) };
                else if (chaosNoise < -0.4) this.groundMap[x][y] = { type: 'dirt', variant: Math.floor(Math.random() * 2) };
                else this.groundMap[x][y] = { type: 'grass', variant: Math.floor(Math.random() * 3) };
            }
        }
    }
    
    generateChaoticWorld() {
        for (let i = 0; i < this.treeCount; i++) {
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 50) {
                const isBurned = Math.random() < 0.2;
                const tree = {
                    x: Math.random() * this.worldWidth,
                    y: Math.random() * this.worldHeight,
                    size: 32,
                    type: Math.random() > 0.5 ? 'pine' : 'oak',
                    burned: isBurned
                };
                const dx = tree.x - this.worldWidth/2;
                const dy = tree.y - this.worldHeight/2;
                if (Math.hypot(dx, dy) > 200) {
                    let tooClose = false;
                    for (let existing of this.trees) {
                        if (Math.hypot(tree.x - existing.x, tree.y - existing.y) < 60) {
                            tooClose = true;
                            break;
                        }
                    }
                    if (!tooClose) {
                        this.trees.push(tree);
                        valid = true;
                    }
                }
                attempts++;
            }
        }
        
        const ruinColors = ['#4a3a2a', '#3a2a1a', '#5a4a3a'];
        for (let i = 0; i < 15; i++) {
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 50) {
                const structure = {
                    x: Math.random() * this.worldWidth,
                    y: Math.random() * this.worldHeight,
                    width: 48,
                    height: 48,
                    color: ruinColors[Math.floor(Math.random() * ruinColors.length)],
                    roofColor: '#5a3a1a',
                    type: 'ruin',
                    destroyed: Math.random() < 0.4
                };
                const dx = structure.x - this.worldWidth/2;
                const dy = structure.y - this.worldHeight/2;
                if (Math.hypot(dx, dy) > 300) {
                    this.structures.push(structure);
                    valid = true;
                }
                attempts++;
            }
        }
        
        for (let i = 0; i < 400; i++) {
            const type = Math.random();
            let deco;
            if (type < 0.3) deco = { type: 'flower', x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, color: '#ff4444' };
            else if (type < 0.5) deco = { type: 'rock', x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, size: 6 };
            else if (type < 0.7) deco = { type: 'rubble', x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight };
            else deco = { type: 'bush', x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, burned: Math.random() < 0.3 };
            
            let collision = false;
            for (let s of this.structures) {
                if (Math.abs(deco.x - s.x) < 30 && Math.abs(deco.y - s.y) < 30) collision = true;
            }
            if (!collision) this.decorations.push(deco);
        }
    }
    
    generateFiresAndSmoke() {
        for (let i = 0; i < 40; i++) {
            this.fires.push({ x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, size: 12 + Math.random() * 20, intensity: 0.5 + Math.random() * 0.8 });
        }
        for (let i = 0; i < 150; i++) {
            this.smokeParticles.push({ x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, size: 8 + Math.random() * 15, opacity: 0.2 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 0.5, vy: -0.5 - Math.random() * 1, life: 100 + Math.random() * 100 });
        }
    }
    
    startWave() {
        if (this.waveInProgress) return; // Prevent double start
        this.waveInProgress = true;
        this.waveSpawningComplete = false;
        this.enemiesToSpawn = Math.floor(5 + this.wave * 1.5);
        this.enemiesRemaining = this.enemiesToSpawn;
        
        this.waveMessage = `WAVE ${this.wave}`;
        this.waveMessageTimer = 120;
        
        const isBossWave = this.wave % 3 === 0;
        
        if (isBossWave) {
            this.waveMessage = `⚠️ BOSS WAVE! ⚠️\nWAVE ${this.wave}`;
            this.spawnBoss();
        } else {
            this.spawnWaveEnemies();
        }
    }

    spawnWaveEnemies() {
        const types = [
            { color: '#4a3a2a', speed: 1.2, health: 50, size: 26, name: 'zombie', damage: 12 },
            { color: '#5a4a3a', speed: 1.6, health: 35, size: 24, name: 'fast zombie', damage: 10 }
        ];
        
        let spawnedCount = 0;
        for (let i = 0; i < this.enemiesToSpawn; i++) {
            setTimeout(() => {
                if (this.gameOver) return;
                
                const angle = Math.random() * Math.PI * 2;
                const distance = 300 + Math.random() * 200;
                let x = this.player.x + Math.cos(angle) * distance;
                let y = this.player.y + Math.sin(angle) * distance;
                x = Math.max(50, Math.min(this.worldWidth - 50, x));
                y = Math.max(50, Math.min(this.worldHeight - 50, y));
                
                const type = types[Math.floor(Math.random() * types.length)];
                const enemy = {
                    x: x, y: y,
                    size: type.size,
                    speed: type.speed + (this.wave * 0.03),
                    health: type.health + Math.floor(this.wave * 2),
                    maxHealth: type.health + Math.floor(this.wave * 2),
                    color: type.color,
                    damage: type.damage,
                    type: type.name,
                    isBoss: false,
                    hitFlash: 0
                };
                
                this.spawnZombieFromGround(x, y, enemy);
                spawnedCount++;
                if (spawnedCount === this.enemiesToSpawn) {
                    this.waveSpawningComplete = true;
                }
            }, i * 300);
        }
        if (this.enemiesToSpawn === 0) this.waveSpawningComplete = true;
    }
    
    spawnBoss() {
        this.bossSpawned = true;
        this.waveSpawningComplete = false;
        
        setTimeout(() => {
            if (this.gameOver) return;
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 400;
            let x = this.player.x + Math.cos(angle) * distance;
            let y = this.player.y + Math.sin(angle) * distance;
            x = Math.max(50, Math.min(this.worldWidth - 50, x));
            y = Math.max(50, Math.min(this.worldHeight - 50, y));
            
            const bossHealth = 200 + this.wave * 20;
            const boss = {
                x: x, y: y,
                size: 48,
                speed: 0.8,
                health: bossHealth,
                maxHealth: bossHealth,
                color: '#8B0000',
                damage: 25,
                type: 'BOSS',
                isBoss: true,
                attackCooldown: 0,
                slamTimer: 0,
                hitFlash: 0
            };
            
            this.spawnZombieFromGround(x, y, boss);
            this.waveSpawningComplete = true;
            
            for (let i = 0; i < 50; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * 60,
                    y: y + (Math.random() - 0.5) * 60,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 40,
                    color: '#ff4400',
                    size: 4 + Math.random() * 6
                });
            }
            
            this.playSound('boss', 0.5);
        }, 1000);
    }
    
    checkWaveCompletion() {
        if (!this.waveInProgress) return;
        if (this.waveSpawningComplete && this.enemies.length === 0 && this.spawningEnemies.length === 0) {
            this.waveInProgress = false;
            this.bossSpawned = false;
            this.wave++;
            
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
            this.molotovs = Math.min(this.molotovs + 1, 6);
            
            this.waveMessage = `WAVE ${this.wave - 1} COMPLETE!`;
            this.waveMessageTimer = 90;
            this.waveCooldown = 180;
            this.updateUI();
        }
    }
    
    drawWaveMessage() {
        if (this.waveMessageTimer > 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 60, this.canvas.width, 120);
            
            this.ctx.fillStyle = '#ffaa44';
            this.ctx.font = 'bold 24px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            
            const lines = this.waveMessage.split('\n');
            for (let i = 0; i < lines.length; i++) {
                this.ctx.fillText(lines[i], this.canvas.width / 2, this.canvas.height / 2 - 20 + (i * 40));
            }
            
            this.ctx.textAlign = 'left';
            this.waveMessageTimer--;
        }
    }
