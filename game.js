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

    spawnAmmoPickups() {
        for (let i = 0; i < 12; i++) {
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 30) {
                const ammo = { x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, mgAmount: 30, shotgunAmount: 6, size: 12 };
                if (Math.hypot(ammo.x - this.player.x, ammo.y - this.player.y) > 250) {
                    this.ammoPickups.push(ammo);
                    valid = true;
                }
                attempts++;
            }
        }
    }
    
    spawnMolotovPickups() {
        for (let i = 0; i < 6; i++) {
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 30) {
                const pickup = { x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, amount: 2, size: 12 };
                if (Math.hypot(pickup.x - this.player.x, pickup.y - this.player.y) > 250) {
                    this.molotovPickups.push(pickup);
                    valid = true;
                }
                attempts++;
            }
        }
    }
    
    addParticle(x, y, color, size) {
        this.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 25, color, size });
    }
    
    addSmoke(x, y) {
        this.smokeParticles.push({ x, y, size: 10 + Math.random() * 15, opacity: 0.3 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 0.8, vy: -0.8 - Math.random() * 1.2, life: 80 + Math.random() * 60 });
    }
    
    throwMolotov() {
        if (this.molotovs <= 0 || this.molotovCooldown > 0) return;
        const fromX = this.player.x + this.player.size/2;
        const fromY = this.player.y + this.player.size/2;
        const dx = this.mouseWorld.x - fromX;
        const dy = this.mouseWorld.y - fromY;
        const distance = Math.hypot(dx, dy);
        const maxDist = 400;
        const actualDist = Math.min(distance, maxDist);
        const ratio = actualDist / Math.max(distance, 1);
        const dirX = dx * ratio;
        const dirY = dy * ratio;
        const arcHeight = Math.min(100, actualDist / 4);
        const landingX = fromX + dirX;
        const landingY = fromY + dirY;
        this.molotovProjectiles.push({ startX: fromX, startY: fromY, targetX: landingX, targetY: landingY, progress: 0, arcHeight, speed: 0.05 });
        this.molotovs--;
        this.molotovCooldown = this.molotovCooldownMax;
        this.playSound('molotov', 0.3);
        this.updateUI();
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'p' && !this.gameOver) { this.togglePause(); return; }
            if (this.showTutorial) {
                if (key === ' ' || key === 'enter' || key === 'escape') {
                    this.closeTutorial();
                }
                return;
            }
            if (this.paused || this.gameOver) return;
            if (this.keys.hasOwnProperty(key)) this.keys[key] = true;
            if (key === 'r' && !this.ammo.reloading) { this.reload(); this.playSound('reload', 0.2); }
            if (key === 'f') this.throwMolotov();
        });
        window.addEventListener('keyup', (e) => { const key = e.key.toLowerCase(); if (this.keys.hasOwnProperty(key)) this.keys[key] = false; });
        window.addEventListener('wheel', (e) => {
            if (this.gameOver || this.paused || this.showTutorial) return;
            if (e.deltaY < 0) this.switchWeapon('mg');
            else if (e.deltaY > 0) this.switchWeapon('shotgun');
        });
        window.addEventListener('mousemove', (e) => {
            this.mouseScreen.x = e.clientX;
            this.mouseScreen.y = e.clientY;
            this.crosshair.style.left = e.clientX + 'px';
            this.crosshair.style.top = e.clientY + 'px';
            this.mouseWorld.x = this.mouseScreen.x + this.camera.x;
            this.mouseWorld.y = this.mouseScreen.y + this.camera.y;
        });
        window.addEventListener('mousedown', (e) => {
            if (this.showTutorial) {
                this.closeTutorial();
                return;
            }
            if (e.button === 0 && !this.gameOver && !this.paused) this.shooting = true;
        });
        window.addEventListener('mouseup', (e) => { if (e.button === 0) this.shooting = false; });
    }
    
    reload() {
        if (this.ammo.total <= 0 || this.ammo.current === this.ammo.maxMag) return;
        this.ammo.reloading = true;
        this.ammo.reloadTimer = this.ammo.reloadTime;
        this.reloadCircular.classList.add('active');
        if (this.reloadSound) {
            const clone = new Audio();
            clone.src = this.reloadSound.src;
            clone.volume = 0.4;
            clone.play().catch(() => {});
        }
    }

    shoot() {
        if (this.ammo.reloading || this.ammo.current <= 0 || this.shootCooldown > 0) {
            if (this.ammo.current <= 0) {
                this.lowAmmoWarningTimer = 60;
                this.playEmptyClickSound();
            }
            return;
        }
        const fromX = this.player.x + this.player.size/2;
        const fromY = this.player.y + this.player.size/2;
        const dx = this.mouseWorld.x - fromX;
        const dy = this.mouseWorld.y - fromY;
        const len = Math.hypot(dx, dy);
        if (len === 0) return;
        const dirX = dx / len;
        const dirY = dy / len;
        const delay = this.currentWeapon === 'mg' ? this.mgShootDelay : this.shotgunShootDelay;
        
        if (this.currentWeapon === 'mg') {
            this.bullets.push({ x: fromX, y: fromY, vx: dirX * this.bulletSpeed, vy: dirY * this.bulletSpeed, size: 4, life: 150, damage: 34, weapon: 'mg' });
            
            const knockbackX = -dirX * 4;
            const knockbackY = -dirY * 4;
            this.player.x += knockbackX;
            this.player.y += knockbackY;
            
            this.screenShake.active = true;
            this.screenShake.intensity = 3;
            this.screenShake.timer = 3;
            
        } else {
            for (let i = -2; i <= 2; i++) {
                const spread = i * 0.08;
                const angle = Math.atan2(dy, dx);
                this.bullets.push({ x: fromX, y: fromY, vx: Math.cos(angle + spread) * this.bulletSpeed, vy: Math.sin(angle + spread) * this.bulletSpeed, size: 3, life: 150, damage: 20, weapon: 'shotgun' });
            }
            
            const knockbackX = -dirX * 12;
            const knockbackY = -dirY * 12;
            this.player.x += knockbackX;
            this.player.y += knockbackY;
            
            this.screenShake.active = true;
            this.screenShake.intensity = 8;
            this.screenShake.timer = 5;
            this.recoilTimer = 5;
        }
        
        this.player.x = Math.max(0, Math.min(this.player.x, this.worldWidth - this.player.size));
        this.player.y = Math.max(0, Math.min(this.player.y, this.worldHeight - this.player.size));
        
        this.ammo.current--;
        this.shootCooldown = delay;
        this.muzzleFlash.active = true;
        this.muzzleFlash.timer = 3;
        this.addParticle(fromX, fromY, '#ffcc00', 4);
        this.addSmoke(fromX, fromY);
        this.playSound('gunshot', this.currentWeapon === 'shotgun' ? 0.25 : 0.2);
        this.updateUI();
    }
    
    updateCamera() {
        const targetX = this.player.x + this.player.size/2 - this.canvas.width/2;
        const targetY = this.player.y + this.player.size/2 - this.canvas.height/2;
        this.camera.targetX = Math.max(0, Math.min(targetX, this.worldWidth - this.canvas.width));
        this.camera.targetY = Math.max(0, Math.min(targetY, this.worldHeight - this.canvas.height));
        let shakeX = 0, shakeY = 0;
        if (this.screenShake.active) {
            shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.timer--;
            if (this.screenShake.timer <= 0) this.screenShake.active = false;
        }
        this.camera.x = this.camera.targetX + shakeX;
        this.camera.y = this.camera.targetY + shakeY;
    }
    
    playEmptyClickSound() {
        if (!this.soundsEnabled) return;
        const now = Date.now();
        if (this.lastClickTime && now - this.lastClickTime < 500) return;
        this.lastClickTime = now;
        if (this.clickSound) {
            const clickClone = new Audio();
            clickClone.src = this.clickSound.src;
            clickClone.volume = 0.3;
            clickClone.play().catch(() => {});
            return;
        }
        if (!this.audioContext) return;
        this.resumeAudio();
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = 80;
        oscillator.type = 'square';
        gainNode.gain.value = 0.15;
        gainNode.gain.exponentialRampToValueAtTime(0.00001, this.audioContext.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    addFloatingNumber(x, y, amount, isCritical = false) {
        this.floatingNumbers.push({
            x: x, y: y,
            value: amount,
            life: 30,
            isCritical: isCritical
        });
    }
    
    updateFloatingNumbers() {
        for (let i = 0; i < this.floatingNumbers.length; i++) {
            const fn = this.floatingNumbers[i];
            fn.life--;
            fn.y -= 1;
            if (fn.life <= 0) {
                this.floatingNumbers.splice(i, 1);
                i--;
            }
        }
    }
    
    drawFloatingNumbers() {
        for (let fn of this.floatingNumbers) {
            const x = fn.x - this.camera.x;
            const y = fn.y - this.camera.y;
            const alpha = Math.min(1, fn.life / 30);
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'center';
            if (fn.isCritical) {
                this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
                this.ctx.font = 'bold 18px monospace';
            } else {
                this.ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
            }
            this.ctx.fillText(`-${fn.value}`, x, y);
            this.ctx.textAlign = 'left';
        }
    }
    
    updatePlayer() {
        if (this.keys.w || this.keys.s || this.keys.a || this.keys.d) {
            this.player.walkBob = Math.sin(Date.now() * 0.015) * 2;
        } else {
            this.player.walkBob = 0;
        }
        if (this.player.invincibleTimer > 0) this.player.invincibleTimer--;
        let newX = this.player.x;
        let newY = this.player.y;
        if (this.keys.w) newY -= this.player.speed;
        if (this.keys.s) newY += this.player.speed;
        if (this.keys.a) newX -= this.player.speed;
        if (this.keys.d) newX += this.player.speed;
        for (let tree of this.trees) {
            if (Math.abs(newX - tree.x) < this.player.size && Math.abs(newY - tree.y) < this.player.size) return;
        }
        for (let struct of this.structures) {
            if (newX < struct.x + struct.width && newX + this.player.size > struct.x && newY < struct.y + struct.height && newY + this.player.size > struct.y) return;
        }
        if (newX >= 0 && newX + this.player.size <= this.worldWidth) this.player.x = newX;
        if (newY >= 0 && newY + this.player.size <= this.worldHeight) this.player.y = newY;
        
        for (let i = 0; i < this.ammoPickups.length; i++) {
            const ammo = this.ammoPickups[i];
            if (Math.hypot(this.player.x - ammo.x, this.player.y - ammo.y) < 25) {
                this.mgAmmo.total += ammo.mgAmount;
                this.shotgunAmmo.total += ammo.shotgunAmount;
                this.ammoPickups.splice(i, 1);
                this.addParticle(ammo.x, ammo.y, '#FFD700', 6);
                this.playSound('pickup', 0.3);
                i--;
                this.updateUI();
            }
        }
        for (let i = 0; i < this.molotovPickups.length; i++) {
            const pickup = this.molotovPickups[i];
            if (Math.hypot(this.player.x - pickup.x, this.player.y - pickup.y) < 25) {
                this.molotovs += pickup.amount;
                this.molotovPickups.splice(i, 1);
                this.addParticle(pickup.x, pickup.y, '#ff6600', 6);
                this.playSound('pickup', 0.3);
                i--;
                this.updateUI();
            }
        }
        for (let fire of this.fires) {
            if (Math.hypot(this.player.x - fire.x, this.player.y - fire.y) < fire.size && this.player.invincibleTimer === 0) {
                this.player.health -= 2;
                this.player.invincibleTimer = 20;
                this.damageFlash.classList.add('active');
                setTimeout(() => this.damageFlash.classList.remove('active'), 200);
                this.playSound('hurt', 0.3);
                this.updateUI();
            }
        }
    }

    updateShooting() {
        if (this.shooting && !this.gameOver) this.shoot();
        if (this.shootCooldown > 0) this.shootCooldown--;
        
        if (this.ammo.reloading) {
            this.ammo.reloadTimer--;
            const progress = 1 - (this.ammo.reloadTimer / this.ammo.reloadTime);
            const circumference = 283;
            const dashoffset = circumference * (1 - progress);
            if (this.reloadProgressCircle) this.reloadProgressCircle.style.strokeDashoffset = dashoffset;
            
            if (this.ammo.reloadTimer <= 0) {
                const toReload = Math.min(this.ammo.maxMag - this.ammo.current, this.ammo.total);
                this.ammo.current += toReload;
                this.ammo.total -= toReload;
                this.ammo.reloading = false;
                this.reloadCircular.classList.remove('active');
                this.updateUI();
            }
        }
        
        if (this.muzzleFlash.active) {
            this.muzzleFlash.timer--;
            if (this.muzzleFlash.timer <= 0) this.muzzleFlash.active = false;
        }
        if (this.molotovCooldown > 0) this.molotovCooldown--;
    }
    
    updateFireZones() {
        for (let i = 0; i < this.fireZones.length; i++) {
            const zone = this.fireZones[i];
            zone.life--;
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                if (Math.hypot(enemy.x - zone.x, enemy.y - zone.y) < zone.radius) {
                    enemy.health -= 1;
                    if (enemy.health <= 0) {
                        this.addBloodSplatter(enemy.x, enemy.y);
                        this.enemies.splice(j, 1);
                        this.score += 10;
                        this.kills++;
                        this.addParticle(enemy.x, enemy.y, '#ff0000', 8);
                        this.addSmoke(enemy.x, enemy.y);
                        this.updateUI();
                        this.playSound('death', 0.25);
                        j--;
                    }
                }
            }
            if (Math.hypot(this.player.x - zone.x, this.player.y - zone.y) < zone.radius && this.player.invincibleTimer === 0) {
                this.player.health -= 1;
                this.player.invincibleTimer = 10;
                this.damageFlash.classList.add('active');
                setTimeout(() => this.damageFlash.classList.remove('active'), 100);
            }
            if (zone.life <= 0) {
                this.fireZones.splice(i, 1);
                i--;
            }
        }
    }
    
    updateMolotovProjectiles() {
        for (let i = 0; i < this.molotovProjectiles.length; i++) {
            const molly = this.molotovProjectiles[i];
            molly.progress += molly.speed;
            if (molly.progress >= 1) {
                this.fireZones.push({ x: molly.targetX, y: molly.targetY, radius: 60, life: 300, maxLife: 300 });
                for (let p = 0; p < 40; p++) this.particles.push({ x: molly.targetX + (Math.random() - 0.5) * 50, y: molly.targetY + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 2, life: 30, color: '#ff6600', size: 3 + Math.random() * 6 });
                for (let s = 0; s < 15; s++) this.addSmoke(molly.targetX + (Math.random() - 0.5) * 30, molly.targetY + (Math.random() - 0.5) * 20);
                this.molotovProjectiles.splice(i, 1);
                i--;
            }
        }
    }
    
    spawnZombieFromGround(x, y, enemyType) {
        for (let i = 0; i < 20; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 4 - 2, life: 30, color: '#8B6914', size: 3 + Math.random() * 4 });
        for (let i = 0; i < 15; i++) this.particles.push({ x: x + (Math.random() - 0.5) * 25, y: y - 10 + Math.random() * 20, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 3 - 1, life: 25, color: '#6B4226', size: 4 + Math.random() * 6 });
        this.spawningEnemies.push({ enemy: enemyType, x: x, y: y, spawnTimer: 90 + Math.random() * 40, emerged: false });
        this.playSound('zombie', 0.2);
    }
    
    updateSpawnAnimations() {
        for (let i = 0; i < this.spawningEnemies.length; i++) {
            const spawn = this.spawningEnemies[i];
            spawn.spawnTimer--;
            if (spawn.spawnTimer > 0 && spawn.spawnTimer % 8 === 0) this.particles.push({ x: spawn.x + (Math.random() - 0.5) * 20, y: spawn.y + 10 - Math.random() * 15, vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 2, life: 20, color: '#8B6914', size: 3 });
            if (spawn.spawnTimer === 60 && !spawn.emerged) for (let p = 0; p < 8; p++) this.particles.push({ x: spawn.x + (Math.random() - 0.5) * 25, y: spawn.y + 5, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 3 - 1, life: 15, color: '#8B5A2B', size: 2 });
            if (spawn.spawnTimer === 40 && !spawn.emerged) for (let p = 0; p < 12; p++) this.particles.push({ x: spawn.x + (Math.random() - 0.5) * 30, y: spawn.y + 8, vx: (Math.random() - 0.5) * 2.5, vy: -Math.random() * 4 - 1, life: 18, color: '#6B4226', size: 3 });
            if (spawn.spawnTimer <= 0 && !spawn.emerged) {
                spawn.emerged = true;
                this.enemies.push(spawn.enemy);
                for (let p = 0; p < 40; p++) this.particles.push({ x: spawn.x + (Math.random() - 0.5) * 45, y: spawn.y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 7 - 4, life: 30, color: '#6B4226', size: 3 + Math.random() * 6 });
                this.spawningEnemies.splice(i, 1);
                i--;
            }
        }
    }
    
    drawSpawningEnemies() {
        for (let spawn of this.spawningEnemies) {
            const x = spawn.x - this.camera.x;
            const y = spawn.y - this.camera.y;
            const progress = 1 - (spawn.spawnTimer / 90);
            const enemyHeight = spawn.enemy.size * progress;
            const enemyY = y + spawn.enemy.size - enemyHeight;
            this.ctx.fillStyle = spawn.enemy.color;
            this.ctx.fillRect(x, enemyY, spawn.enemy.size, enemyHeight);
            const moundSize = 8 + (progress * 10);
            this.ctx.fillStyle = '#8B6914';
            this.ctx.beginPath();
            this.ctx.ellipse(x + spawn.enemy.size/2, y + spawn.enemy.size - 3, moundSize, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            if (progress > 0.3) {
                this.ctx.fillStyle = '#2a1a0a';
                this.ctx.fillRect(x - 5, enemyY + 5, 5, 8);
                this.ctx.fillRect(x + spawn.enemy.size, enemyY + 5, 5, 8);
            }
            if (progress > 0.6) {
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(x + 5, enemyY + 2, 3, 3);
                this.ctx.fillRect(x + spawn.enemy.size - 8, enemyY + 2, 3, 3);
            }
        }
    }

    updateBullets() {
        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            if (bullet.life <= 0 || bullet.x < 0 || bullet.x > this.worldWidth || bullet.y < 0 || bullet.y > this.worldHeight) {
                this.bullets.splice(i, 1);
                i--;
                continue;
            }
            let hit = false;
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                if (Math.abs(bullet.x - enemy.x) < enemy.size && Math.abs(bullet.y - enemy.y) < enemy.size) {
                    const damage = bullet.damage;
                    enemy.health -= damage;
                    enemy.hitFlash = 5;
                    this.addFloatingNumber(enemy.x, enemy.y, damage, damage >= 34);
                    this.bullets.splice(i, 1);
                    this.addParticle(bullet.x, bullet.y, '#ff6666', 4);
                    this.hitMarker.classList.add('active');
                    setTimeout(() => this.hitMarker.classList.remove('active'), 300);
                    this.playSound('hit', 0.15);
                    
                    if (enemy.health <= 0) {
                        this.addBloodSplatter(enemy.x, enemy.y);
                        this.enemies.splice(j, 1);
                        this.score += 10;
                        this.kills++;
                        this.addParticle(enemy.x, enemy.y, '#ff0000', 8);
                        this.addSmoke(enemy.x, enemy.y);
                        this.updateUI();
                        this.playSound('death', 0.25);
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) i--;
        }
    }
    
    addBloodSplatter(x, y) {
        for (let i = 0; i < 5 + Math.random() * 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 5 + Math.random() * 25;
            this.bloodSplatters.push({ x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist, size: 3 + Math.random() * 8, life: 300, maxLife: 300, color: `hsl(0, ${70 + Math.random() * 20}%, ${30 + Math.random() * 20}%)` });
        }
        this.bloodSplatters.push({ x, y, size: 12 + Math.random() * 10, life: 300, maxLife: 300, color: '#8B0000' });
    }
    
    updateBloodSplatters() {
        for (let i = 0; i < this.bloodSplatters.length; i++) {
            this.bloodSplatters[i].life--;
            if (this.bloodSplatters[i].life <= 0) { this.bloodSplatters.splice(i, 1); i--; }
        }
    }
    
    spawnSingleEnemy() {
        // This function is not used – wave system handles all spawning.
        // Kept for reference but never called.
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            if (enemy.hitFlash > 0) enemy.hitFlash--;
            
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 0) {
                const moveX = (dx / dist) * enemy.speed;
                const moveY = (dy / dist) * enemy.speed;
                enemy.x += moveX;
                enemy.y += moveY;
            }
            
            if (enemy.isBoss) {
                if (enemy.attackCooldown > 0) enemy.attackCooldown--;
                if (enemy.attackCooldown === 0 && dist < 150) {
                    enemy.attackCooldown = 120;
                    this.screenShake.active = true;
                    this.screenShake.intensity = 12;
                    this.screenShake.timer = 10;
                    if (dist < 80) {
                        this.player.health -= 20;
                        this.player.invincibleTimer = 20;
                        this.damageFlash.classList.add('active');
                        setTimeout(() => this.damageFlash.classList.remove('active'), 200);
                        this.playSound('hurt', 0.5);
                    }
                    for (let i = 0; i < 30; i++) {
                        this.particles.push({
                            x: enemy.x + (Math.random() - 0.5) * 50,
                            y: enemy.y + (Math.random() - 0.5) * 30,
                            vx: (Math.random() - 0.5) * 4,
                            vy: -Math.random() * 5,
                            life: 25,
                            color: '#ff8844',
                            size: 3
                        });
                    }
                }
            }
            
            if (Math.abs(enemy.x - this.player.x) < this.player.size && Math.abs(enemy.y - this.player.y) < this.player.size && this.player.invincibleTimer === 0) {
                this.player.health -= enemy.damage;
                this.player.invincibleTimer = 35;
                this.damageFlash.classList.add('active');
                setTimeout(() => this.damageFlash.classList.remove('active'), 200);
                this.screenShake.active = true;
                this.screenShake.intensity = 8;
                this.screenShake.timer = 5;
                const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                this.player.x -= Math.cos(angle) * 35;
                this.player.y -= Math.sin(angle) * 35;
                this.playSound('hurt', 0.35);
                if (this.player.health <= 0) this.gameOver = true;
                this.updateUI();
            }
        }
    }
    
    updateFiresAndSmoke() {
        for (let fire of this.fires) {
            fire.intensity = 0.5 + Math.random() * 0.8;
            if (Math.random() < 0.6) {
                this.addSmoke(fire.x + (Math.random() - 0.5) * 35, fire.y - 15 + (Math.random() - 0.5) * 20);
            }
            if (Math.random() < 0.3) {
                for (let i = 0; i < 5; i++) {
                    this.particles.push({
                        x: fire.x + (Math.random() - 0.5) * 55,
                        y: fire.y + (Math.random() - 0.5) * 15 + 5,
                        vx: (Math.random() - 0.5) * 0.8,
                        vy: (Math.random() - 0.5) * 0.5 - 0.2,
                        life: 25 + Math.random() * 20,
                        color: `rgba(255, ${80 + Math.random() * 120}, 0, 0.7)`,
                        size: 1.5 + Math.random() * 2.5
                    });
                }
            }
            if (Math.random() < 0.01 && this.audioContext) this.playSound('fire', 0.08);
        }
        if (Math.random() < 0.008 && this.fires.length < 60) {
            this.fires.push({ x: Math.random() * this.worldWidth, y: Math.random() * this.worldHeight, size: 10 + Math.random() * 25, intensity: 0.6 });
        }
        for (let i = 0; i < this.smokeParticles.length; i++) {
            const smoke = this.smokeParticles[i];
            smoke.x += smoke.vx;
            smoke.y += smoke.vy;
            smoke.life--;
            smoke.size += 0.5;
            if (smoke.life <= 0) { this.smokeParticles.splice(i, 1); i--; }
        }
    }
    
    updateParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].life--;
            if (this.particles[i].life <= 0) { this.particles.splice(i, 1); i--; }
            else {
                this.particles[i].x += this.particles[i].vx;
                this.particles[i].y += this.particles[i].vy;
            }
        }
    }

    updateUI() {
        const healthPercent = this.player.health / this.player.maxHealth;
        if (this.healthFill) this.healthFill.style.width = (healthPercent * 100) + '%';
        if (this.healthValue) this.healthValue.textContent = Math.floor(this.player.health);
        
        const ammoPercent = this.ammo.current / this.ammo.maxMag;
        if (this.ammoFill) this.ammoFill.style.width = (ammoPercent * 100) + '%';
        if (this.ammoCurrent) this.ammoCurrent.textContent = this.ammo.current;
        if (this.ammoTotal) this.ammoTotal.textContent = this.ammo.total;
        
        const weaponNameElement = document.getElementById('weaponName');
        if (weaponNameElement) {
            weaponNameElement.textContent = this.currentWeapon === 'mg' ? 'MACHINE GUN' : 'SHOTGUN';
        }
        
        if (this.scoreValue) this.scoreValue.textContent = this.score;
        if (this.killsValue) this.killsValue.textContent = this.kills;
        
        const molotovCountElement = document.getElementById('molotovCount');
        if (molotovCountElement) molotovCountElement.textContent = this.molotovs;
        
        if (this.currentWeapon === 'shotgun') {
            if (this.ammo.current <= 2 && this.ammo.current > 0) this.lowAmmoWarningTimer = 60;
        } else {
            if (this.ammo.current <= 5 && this.ammo.current > 0) this.lowAmmoWarningTimer = 60;
        }
        if (this.player.health <= 30) this.lowHealthWarningTimer = 40;
    }
    
    updateWarnings() {
        if (this.lowAmmoWarningTimer > 0) {
            if (this.lowAmmoWarning) this.lowAmmoWarning.classList.add('active');
            this.lowAmmoWarningTimer--;
        } else {
            if (this.lowAmmoWarning) this.lowAmmoWarning.classList.remove('active');
        }
        if (this.lowHealthWarningTimer > 0) {
            if (this.lowHealthWarning) this.lowHealthWarning.classList.add('active');
            this.lowHealthWarningTimer--;
        } else {
            if (this.lowHealthWarning) this.lowHealthWarning.classList.remove('active');
        }
    }
    
    update() {
        if (this.gameOver) return;
        if (this.paused) return;
        if (this.showTutorial) return;
        
        if (!this.waveInProgress && this.waveCooldown > 0) {
            this.waveCooldown--;
            if (this.waveCooldown <= 0) {
                this.startWave();
            }
        }
        
        this.updatePlayer();
        this.updateShooting();
        this.updateBullets();
        this.updateEnemies();
        this.updateFireZones();
        this.updateMolotovProjectiles();
        this.updateFiresAndSmoke();
        this.updateParticles();
        this.updateBloodSplatters();
        this.updateSpawnAnimations();
        this.updateFloatingNumbers();
        this.updateCamera();
        this.updateWarnings();
        
        this.checkWaveCompletion();
        
        if (this.player.health < this.player.maxHealth) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 0.03);
            this.updateUI();
        }
        this.fogIntensity = 0.3 + Math.sin(Date.now() * 0.001) * 0.1;
        if (this.fogOverlay) this.fogOverlay.style.opacity = this.fogIntensity;
    }
    
    drawGround() {
        for (let x = 0; x < this.worldWidth; x += this.groundSize) {
            for (let y = 0; y < this.worldHeight; y += this.groundSize) {
                const ground = this.groundMap[x]?.[y] || { type: 'grass', variant: 0 };
                let color;
                if (ground.type === 'burned') color = '#2a1a0a';
                else if (ground.type === 'cobble') color = '#6a5a4a';
                else if (ground.type === 'dirt') color = '#6b4a2a';
                else color = ['#3a6a32', '#2d5a2c', '#3a5a32'][ground.variant];
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x - this.camera.x, y - this.camera.y, this.groundSize + 0.5, this.groundSize + 0.5);
                if (ground.type === 'burned') {
                    this.ctx.fillStyle = '#1a0a00';
                    this.ctx.fillRect(x + 8 - this.camera.x, y + 12 - this.camera.y, 4, 4);
                    this.ctx.fillRect(x + 20 - this.camera.x, y + 8 - this.camera.y, 3, 3);
                }
            }
        }
        // Draw craters
        for (let c of this.craters) {
            this.ctx.fillStyle = '#1a0a00';
            this.ctx.beginPath();
            this.ctx.arc(c.x - this.camera.x, c.y - this.camera.y, c.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#2a1a0a';
            this.ctx.beginPath();
            this.ctx.arc(c.x - this.camera.x, c.y - this.camera.y, c.radius - 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawPonds() {
        for (let p of this.ponds) {
            const x = p.x - this.camera.x;
            const y = p.y - this.camera.y;
            this.ctx.fillStyle = '#4a90e2';
            this.ctx.beginPath();
            this.ctx.arc(x, y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#6ab0ff';
            this.ctx.fillRect(x - 8, y - 5, 6, 3);
            this.ctx.fillRect(x + 5, y + 3, 5, 2);
        }
    }
    
    drawDecorations() {
        for (let deco of this.decorations) {
            if (deco.type === 'flower') {
                this.ctx.fillStyle = deco.color;
                this.ctx.fillRect(deco.x - 2 - this.camera.x, deco.y - 2 - this.camera.y, 4, 4);
            } else if (deco.type === 'rock') {
                this.ctx.fillStyle = '#5a5a4a';
                this.ctx.fillRect(deco.x - 3 - this.camera.x, deco.y - 2 - this.camera.y, 6, 4);
            } else if (deco.type === 'rubble') {
                this.ctx.fillStyle = '#6a5a4a';
                this.ctx.fillRect(deco.x - 4 - this.camera.x, deco.y - 3 - this.camera.y, 8, 6);
            } else if (deco.type === 'bush') {
                this.ctx.fillStyle = deco.burned ? '#2a1a0a' : '#2d6a2c';
                this.ctx.fillRect(deco.x - 5 - this.camera.x, deco.y - 5 - this.camera.y, 10, 10);
            }
        }
    }
