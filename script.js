// État global de l'application
const appState = {
    currentMode: 'normal', // 'normal' ou 'test'
    recordings: {
        normal: {},
        test: {}
    },
    autoSaveInterval: null,
    lastSaveTime: null
};

// Initialiser le mode actuel au démarrage selon l'onglet actif
function initializeMode() {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('data-tab');
        if (tabId === 'mode-normal') {
            appState.currentMode = 'normal';
        } else if (tabId === 'mode-test') {
            appState.currentMode = 'test';
        }
    }
    console.log('Mode initial:', appState.currentMode);
}

// ===== SYSTÈME DE TOAST NOTIFICATIONS =====
const Toast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', title = '', duration = 5000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Icônes selon le type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        // Titres par défaut
        const defaultTitles = {
            success: 'Succès',
            error: 'Erreur',
            warning: 'Attention',
            info: 'Information'
        };
        
        const toastTitle = title || defaultTitles[type];
        
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${toastTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Fermer">×</button>
        `;
        
        this.container.appendChild(toast);
        
        // Fermeture au clic
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));
        toast.addEventListener('click', (e) => {
            if (e.target !== closeBtn) {
                this.remove(toast);
            }
        });
        
        // Auto-suppression
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }
        
        return toast;
    },
    
    remove(toast) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },
    
    success(message, title = '') {
        return this.show(message, 'success', title);
    },
    
    error(message, title = '') {
        return this.show(message, 'error', title);
    },
    
    warning(message, title = '') {
        return this.show(message, 'warning', title);
    },
    
    info(message, title = '') {
        return this.show(message, 'info', title);
    }
};

// ===== LOADING OVERLAY =====
const Loading = {
    overlay: null,
    
    show(text = 'Chargement...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-text">${text}</div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.style.animation = 'fadeOut 0.2s ease forwards';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                }
            }, 200);
        }
    }
};

// ===== AUTO-SAVE AVEC LOCALSTORAGE =====
const AutoSave = {
    indicator: null,
    debounceTimer: null,
    
    init() {
        // Créer l'indicateur
        if (!this.indicator) {
            this.indicator = document.createElement('div');
            this.indicator.className = 'autosave-indicator';
            this.indicator.innerHTML = '<div class="icon"></div><span class="text">Sauvegarde automatique</span>';
            document.body.appendChild(this.indicator);
        }
        
        // Restaurer les données sauvegardées
        this.restore();
        
        // Démarrer l'auto-save
        this.startAutoSave();
    },
    
    save() {
        try {
            const mode = appState.currentMode;
            const data = {
                mode,
                timestamp: Date.now(),
                forms: {}
            };
            
            // Sauvegarder les formulaires
            if (mode === 'normal') {
                data.forms = {
                    username: document.getElementById('username')?.value || '',
                    accessCode: document.getElementById('accessCode')?.value || '',
                    numeroDossier: document.getElementById('numeroDossier')?.value || '',
                    nomPatient: document.getElementById('nomPatient')?.value || ''
                };
            } else if (mode === 'test') {
                data.forms = {
                    numeroDossier: document.getElementById('numeroDossierTest')?.value || '',
                    nomPatient: document.getElementById('nomPatientTest')?.value || ''
                };
            }
            
            localStorage.setItem('dictamed_autosave', JSON.stringify(data));
            appState.lastSaveTime = Date.now();
            
            this.showIndicator('saved');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    },
    
    restore() {
        try {
            const saved = localStorage.getItem('dictamed_autosave');
            if (!saved) return;
            
            const data = JSON.parse(saved);
            
            // Vérifier si les données ne sont pas trop anciennes (24h)
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - data.timestamp > dayInMs) {
                localStorage.removeItem('dictamed_autosave');
                return;
            }
            
            // Restaurer selon le mode
            if (data.mode === 'normal' && document.getElementById('username')) {
                Object.entries(data.forms).forEach(([key, value]) => {
                    const element = document.getElementById(key);
                    if (element && value) {
                        element.value = value;
                        // Déclencher l'événement input pour mettre à jour les compteurs
                        element.dispatchEvent(new Event('input'));
                    }
                });
                
                Toast.info('Vos données ont été restaurées', 'Reprise de session');
            } else if (data.mode === 'test' && document.getElementById('numeroDossierTest')) {
                Object.entries(data.forms).forEach(([key, value]) => {
                    const testKey = key === 'numeroDossier' ? 'numeroDossierTest' : 'nomPatientTest';
                    const element = document.getElementById(testKey);
                    if (element && value) {
                        element.value = value;
                        element.dispatchEvent(new Event('input'));
                    }
                });
                
                Toast.info('Vos données ont été restaurées', 'Reprise de session');
            }
        } catch (error) {
            console.error('Erreur lors de la restauration:', error);
        }
    },
    
    startAutoSave() {
        // Sauvegarder toutes les 30 secondes
        appState.autoSaveInterval = setInterval(() => {
            this.save();
        }, 30000);
        
        // Sauvegarder aussi lors de changements
        const inputs = document.querySelectorAll('input[type="text"], input[type="password"], textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.showIndicator('saving');
                this.debounceTimer = setTimeout(() => {
                    this.save();
                }, 2000); // 2 secondes après le dernier changement
            });
        });
    },
    
    showIndicator(state) {
        if (!this.indicator) return;
        
        this.indicator.className = 'autosave-indicator show ' + state;
        
        setTimeout(() => {
            this.indicator.classList.remove('show');
        }, 2000);
    },
    
    clear() {
        localStorage.removeItem('dictamed_autosave');
    }
};

// Configuration des sections par mode
const sectionsConfig = {
    normal: ['partie1', 'partie2', 'partie3', 'partie4'],
    test: ['clinique', 'antecedents', 'biologie']
};

// Gestion des photos pour le mode mode DMI
let uploadedPhotos = [];

// ===== NAVIGATION PAR ONGLETS =====
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

function switchTab(tabId) {
    // Désactiver tous les onglets et contenus
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activer l'onglet et le contenu sélectionnés
    document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
    document.getElementById(tabId)?.classList.add('active');

    // Mettre à jour le mode actuel
    if (tabId === 'mode-normal') {
        appState.currentMode = 'normal';
    } else if (tabId === 'mode-test') {
        appState.currentMode = 'test';
    }
}

// Rendre la fonction switchTab globale pour les boutons CTA
window.switchTab = switchTab;

// ===== COMPTEUR DE CARACTÈRES =====
function initCharCounters() {
    const inputs = [
        { id: 'numeroDossier', counterId: 'numeroDossierCounter' },
        { id: 'nomPatient', counterId: 'nomPatientCounter' },
        { id: 'numeroDossierTest', counterId: 'numeroDossierTestCounter' },
        { id: 'nomPatientTest', counterId: 'nomPatientTestCounter' },
        { id: 'numeroDossierTexte', counterId: 'numeroDossierTexteCounter' },
        { id: 'nomPatientTexte', counterId: 'nomPatientTexteCounter' }
    ];

    inputs.forEach(({ id, counterId }) => {
        const input = document.getElementById(id);
        const counter = document.getElementById(counterId);
        
        if (input && counter) {
            input.addEventListener('input', () => {
                const length = input.value.length;
                const maxLength = input.maxLength;
                counter.textContent = `${length}/${maxLength}`;

                // Changer la couleur selon le niveau
                counter.classList.remove('warning', 'danger');
                if (length >= maxLength) {
                    counter.classList.add('danger');
                } else if (length >= maxLength * 0.8) {
                    counter.classList.add('warning');
                }

                // Validation pour le mode mode DMI
                if (id === 'numeroDossierTexte') {
                    validateTexteMode();
                }
            });
        }
    });

    // Compteur pour le textarea
    const texteLibre = document.getElementById('texteLibre');
    const texteLibreCounter = document.getElementById('texteLibreCounter');
    if (texteLibre && texteLibreCounter) {
        texteLibre.addEventListener('input', () => {
            texteLibreCounter.textContent = texteLibre.value.length;
        });
    }
}

// ===== PARTIE 4 OPTIONNELLE =====
function initOptionalSection() {
    const toggleBtn = document.getElementById('togglePartie4');
    const partie4 = document.querySelector('[data-section="partie4"]');
    
    if (toggleBtn && partie4) {
        toggleBtn.addEventListener('click', () => {
            partie4.classList.toggle('hidden');
            toggleBtn.textContent = partie4.classList.contains('hidden') 
                ? 'Afficher Partie 4 (optionnelle)' 
                : 'Masquer Partie 4';
        });
    }
}

// ===== ENREGISTREMENT AUDIO =====
class AudioRecorder {
    constructor(sectionElement) {
        this.section = sectionElement;
        this.sectionId = sectionElement.getAttribute('data-section');
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.startTime = null;
        this.pausedTime = 0;
        this.timerInterval = null;
        this.audioBlob = null;
        
        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.statusBadge = this.section.querySelector('.status-badge');
        this.timer = this.section.querySelector('.timer');
        this.recordedBadge = this.section.querySelector('.recorded-badge');
        this.btnRecord = this.section.querySelector('.btn-record');
        this.btnPause = this.section.querySelector('.btn-pause');
        this.btnStop = this.section.querySelector('.btn-stop');
        this.btnReplay = this.section.querySelector('.btn-replay');
        this.btnDelete = this.section.querySelector('.btn-delete');
        this.audioPlayer = this.section.querySelector('.audio-player');
    }

    initEventListeners() {
        this.btnRecord.addEventListener('click', () => this.startRecording());
        this.btnPause.addEventListener('click', () => this.pauseRecording());
        this.btnStop.addEventListener('click', () => this.stopRecording());
        this.btnReplay.addEventListener('click', () => this.replayRecording());
        this.btnDelete.addEventListener('click', () => this.deleteRecording());
    }

    async startRecording() {
        try {
            // Vérifier la compatibilité du navigateur
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Votre navigateur ne supporte pas l\'enregistrement audio. Veuillez utiliser un navigateur moderne (Chrome, Firefox, Edge, Safari).');
            }

            // Afficher un indicateur de chargement
            this.updateStatus('loading', '⏳ Accès au microphone...');
            this.btnRecord.disabled = true;

            // Demander l'accès au microphone avec paramètres optimisés
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100,
                    channelCount: 1  // Mono pour réduire la taille
                }
            });

            // Déterminer le format audio supporté
            const mimeType = this.getSupportedMimeType();
            console.log('Format audio utilisé:', mimeType);
            
            // Créer le MediaRecorder avec options optimisées
            const options = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : {};
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            // Événement pour collecter les données audio
            this.mediaRecorder.addEventListener('dataavailable', event => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            });

            // Événement de fin d'enregistrement
            this.mediaRecorder.addEventListener('stop', () => {
                this.audioBlob = new Blob(this.audioChunks, { type: mimeType || 'audio/webm' });
                const audioUrl = URL.createObjectURL(this.audioBlob);
                this.audioPlayer.src = audioUrl;
                this.audioPlayer.classList.remove('hidden');
                
                // Afficher la taille du fichier
                const sizeMB = (this.audioBlob.size / (1024 * 1024)).toFixed(2);
                console.log(`Enregistrement terminé: ${sizeMB} MB`);
            });

            // Gestion des erreurs pendant l'enregistrement
            this.mediaRecorder.addEventListener('error', (event) => {
                console.error('Erreur MediaRecorder:', event.error);
                Toast.error('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.', 'Erreur d\'enregistrement');
                this.resetRecording();
            });

            // Commencer l'enregistrement
            this.mediaRecorder.start(1000); // Collecter les données chaque seconde
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            
            // Mettre à jour l'UI
            this.updateStatus('recording', '🔴 En cours');
            this.btnRecord.classList.add('hidden');
            this.btnRecord.disabled = false;
            this.btnPause.classList.remove('hidden');
            this.btnStop.classList.remove('hidden');
            
            // Ajouter un indicateur visuel d'enregistrement
            this.section.classList.add('is-recording');

        } catch (error) {
            console.error('Erreur d\'accès au microphone:', error);
            
            // Messages d'erreur personnalisés
            let errorMessage = 'Erreur : Impossible d\'accéder au microphone.';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = '🎤 Accès refusé au microphone.\n\nVeuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur et réessayer.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = '🎤 Aucun microphone détecté.\n\nVeuillez connecter un microphone et réessayer.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = '🎤 Microphone déjà utilisé.\n\nFermez les autres applications utilisant le microphone et réessayer.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Toast.error(errorMessage, 'Accès au microphone');
            this.resetRecording();
        }
    }

    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
            this.pausedTime = Date.now() - this.startTime;
            this.stopTimer();
            this.updateStatus('paused', '⏸️ En pause');
            this.btnPause.textContent = '▶️ Reprendre';
            this.btnPause.classList.add('btn-resume');
            this.section.classList.remove('is-recording');
            this.section.classList.add('is-paused');
        } else if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
            this.startTime = Date.now() - this.pausedTime;
            this.startTimer();
            this.updateStatus('recording', '🔴 En cours');
            this.btnPause.textContent = '⏸️ Pause';
            this.btnPause.classList.remove('btn-resume');
            this.section.classList.remove('is-paused');
            this.section.classList.add('is-recording');
        }
    }

    stopRecording() {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.stopTimer();
            
            // Arrêter tous les tracks du stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }

            // Mettre à jour l'UI (correction: ne plus afficher "Enregistré" dans le status badge)
            this.updateStatus('ready', 'Prêt');
            this.btnRecord.classList.add('hidden');
            this.btnPause.classList.add('hidden');
            this.btnPause.textContent = '⏸️ Pause'; // Reset le texte
            this.btnPause.classList.remove('btn-resume');
            this.btnStop.classList.add('hidden');
            this.btnReplay.classList.remove('hidden');
            this.btnDelete.classList.remove('hidden');
            this.recordedBadge.classList.remove('hidden'); // Badge vert unique
            
            // Marquer la section comme enregistrée
            this.section.classList.remove('is-recording', 'is-paused');
            this.section.classList.add('recorded');
            
            // Mettre à jour le compteur de sections
            updateSectionCount();
            
            // Feedback sonore optionnel (vibration sur mobile)
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
        }
    }

    replayRecording() {
        if (this.audioPlayer.src) {
            this.audioPlayer.play();
        }
    }

    deleteRecording() {
        if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet enregistrement ?\n\nCette action est irréversible.')) {
            this.resetRecording();
        }
    }

    resetRecording() {
        // Arrêter le stream si actif
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Arrêter le MediaRecorder si actif
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Réinitialiser l'état
        this.audioBlob = null;
        this.audioChunks = [];
        this.pausedTime = 0;
        this.timer.textContent = '00:00';
        this.audioPlayer.src = '';
        this.audioPlayer.classList.add('hidden');
        this.stopTimer();
        
        // Réinitialiser l'UI
        this.updateStatus('ready', '⚪ Prêt');
        this.btnRecord.classList.remove('hidden');
        this.btnRecord.disabled = false;
        this.btnPause.classList.add('hidden');
        this.btnPause.textContent = '⏸️ Pause';
        this.btnPause.classList.remove('btn-resume');
        this.btnStop.classList.add('hidden');
        this.btnReplay.classList.add('hidden');
        this.btnDelete.classList.add('hidden');
        this.recordedBadge.classList.add('hidden');
        
        // Retirer tous les marquages
        this.section.classList.remove('recorded', 'is-recording', 'is-paused');
        
        // Mettre à jour le compteur de sections
        updateSectionCount();
    }

    startTimer() {
        const MAX_DURATION = 120; // 2 minutes = 120 secondes
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            this.timer.textContent = 
                `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            
            // Arrêt automatique après 2 minutes
            if (seconds >= MAX_DURATION) {
                Toast.info('Durée maximale de 2 minutes atteinte. Enregistrement arrêté automatiquement.', 'Limite atteinte', 5000);
                this.stopRecording();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateStatus(status, text) {
        this.statusBadge.setAttribute('data-status', status);
        this.statusBadge.textContent = text;
    }

    getSupportedMimeType() {
        // Liste des formats par ordre de préférence (MP3 en priorité)
        const types = [
            'audio/mpeg',              // MP3 - Priorité maximale
            'audio/mp4',               // M4A/AAC
            'audio/webm;codecs=opus',  // WebM Opus
            'audio/webm',              // WebM
            'audio/ogg;codecs=opus',   // Ogg Opus
            'audio/wav'                // WAV (fallback)
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        // Fallback : laisser le navigateur choisir
        return '';
    }

    async getBase64Audio() {
        if (!this.audioBlob) return null;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(this.audioBlob);
        });
    }

    getAudioFormat() {
        if (!this.audioBlob) return 'webm';
        
        const type = this.audioBlob.type;
        if (type.includes('webm')) return 'webm';
        if (type.includes('ogg')) return 'ogg';
        if (type.includes('mp4')) return 'mp4';
        if (type.includes('mpeg')) return 'mp3';
        if (type.includes('wav')) return 'wav';
        return 'webm'; // Format par défaut moderne
    }

    getMimeType() {
        return this.audioBlob ? this.audioBlob.type : 'audio/mpeg';
    }

    hasRecording() {
        return this.audioBlob !== null;
    }
}

// Initialiser les enregistreurs audio
const audioRecorders = new Map();

function initAudioRecorders() {
    const recordingSections = document.querySelectorAll('.recording-section');
    
    recordingSections.forEach(section => {
        const sectionId = section.getAttribute('data-section');
        const recorder = new AudioRecorder(section);
        audioRecorders.set(sectionId, recorder);
    });
}

// ===== COMPTEUR DE SECTIONS =====
function updateSectionCount() {
    const mode = appState.currentMode;
    const sections = sectionsConfig[mode];
    let count = 0;

    sections.forEach(sectionId => {
        const recorder = audioRecorders.get(sectionId);
        if (recorder && recorder.hasRecording()) {
            count++;
        }
    });

    // Mettre à jour l'affichage
    const countElements = document.querySelectorAll('.sections-count');
    countElements.forEach(el => {
        if (el.closest(`#mode-${mode}`)) {
            el.textContent = `${count} section(s) enregistrée(s)`;
        }
    });

    // Activer/désactiver le bouton d'envoi
    const submitBtn = mode === 'normal' 
        ? document.getElementById('submitNormal')
        : document.getElementById('submitTest');
    
    if (submitBtn) {
        submitBtn.disabled = count === 0;
    }
}

// ===== ENVOI DES DONNÉES =====
async function sendData(mode) {
    try {
        const submitBtn = mode === 'normal' 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Préparer le payload
        const payload = await preparePayload(mode);
        
        if (!payload) {
            Toast.warning('Veuillez remplir tous les champs obligatoires avant d\'envoyer.', 'Champs manquants');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
            return;
        }

        // Déterminer l'endpoint
        const endpoint = mode === 'normal'
            ? 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode'
            : 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed';

        // Envoyer les données
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            Toast.success('Votre dossier a été envoyé et traité avec succès !', 'Envoi réussi');
            
            if (mode === 'test') {
                // Mode Test : Afficher le Google Sheet et notification
                const googleSheetCard = document.getElementById('googleSheetCard');
                if (googleSheetCard) {
                    googleSheetCard.style.display = 'block';
                    // Faire défiler vers la carte Google Sheet
                    googleSheetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                
                // Notification pour consulter le Google Sheet
                setTimeout(() => {
                    Toast.info('Consultez le Google Sheet pour voir vos données transcrites en temps réel.', 'Résultats disponibles', 8000);
                }, 1000);
                
                // NE PAS réinitialiser en mode test
            } else {
                // Mode Normal : Réinitialiser automatiquement
                resetForm(mode);
                AutoSave.clear();
                Toast.success('Formulaire réinitialisé pour un nouveau patient.', 'Prêt', 3000);
            }
        } else {
            const errorText = await response.text();
            Toast.error(`Le serveur a renvoyé une erreur (${response.status}). Veuillez réessayer ou contactez le support.`, 'Erreur d\'envoi');
            console.error('Détails:', errorText);
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        Toast.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
    } finally {
        const submitBtn = mode === 'normal' 
            ? document.getElementById('submitNormal')
            : document.getElementById('submitTest');
        submitBtn.disabled = false;
        submitBtn.textContent = mode === 'normal' ? 'Envoyer les données' : 'Envoyer les données Test';
    }
}

async function preparePayload(mode) {
    const payload = {
        mode: mode,
        recordedAt: new Date().toISOString(),
        sections: {}
    };

    if (mode === 'normal') {
        // Validation des champs obligatoires
        const username = document.getElementById('username').value.trim();
        const accessCode = document.getElementById('accessCode').value.trim();
        const numeroDossier = document.getElementById('numeroDossier').value.trim();
        const nomPatient = document.getElementById('nomPatient').value.trim();

        if (!username || !accessCode || !numeroDossier || !nomPatient) {
            return null;
        }

        payload.username = username;
        payload.accessCode = accessCode;
        payload.NumeroDeDossier = numeroDossier;
        payload.NomDuPatient = nomPatient;

        // Collecter les enregistrements
        const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
        let index = 1;
        
        for (const sectionId of sections) {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                const base64 = await recorder.getBase64Audio();
                const format = recorder.getAudioFormat();
                
                payload.sections[sectionId] = {
                    audioBase64: base64,
                    fileName: `msgVocal${index}.${format}`,
                    mimeType: recorder.getMimeType(),
                    format: format
                };
                index++;
            }
        }

    } else {
        // Mode Test
        const numeroDossier = document.getElementById('numeroDossierTest').value.trim();
        const nomPatient = document.getElementById('nomPatientTest').value.trim();

        if (!numeroDossier || !nomPatient) {
            return null;
        }

        payload.NumeroDeDossier = numeroDossier;
        payload.NomDuPatient = nomPatient;

        // Collecter les enregistrements
        const sections = ['clinique', 'antecedents', 'biologie'];
        let index = 1;
        
        for (const sectionId of sections) {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                const base64 = await recorder.getBase64Audio();
                const format = recorder.getAudioFormat();
                
                payload.sections[sectionId] = {
                    audioBase64: base64,
                    fileName: `msgVocal${index}.${format}`,
                    mimeType: recorder.getMimeType(),
                    format: format
                };
                index++;
            }
        }
    }

    return payload;
}

function resetForm(mode) {
    if (mode === 'normal') {
        document.getElementById('username').value = '';
        document.getElementById('accessCode').value = '';
        document.getElementById('numeroDossier').value = '';
        document.getElementById('nomPatient').value = '';
        
        // Réinitialiser les compteurs de caractères
        const counters = [
            { input: 'numeroDossier', counter: 'numeroDossierCounter' },
            { input: 'nomPatient', counter: 'nomPatientCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        const sections = ['partie1', 'partie2', 'partie3', 'partie4'];
        sections.forEach(sectionId => {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    } else {
        document.getElementById('numeroDossierTest').value = '';
        document.getElementById('nomPatientTest').value = '';
        
        // Réinitialiser les compteurs de caractères
        const counters = [
            { input: 'numeroDossierTest', counter: 'numeroDossierTestCounter' },
            { input: 'nomPatientTest', counter: 'nomPatientTestCounter' }
        ];
        counters.forEach(({ counter }) => {
            const counterEl = document.getElementById(counter);
            if (counterEl) counterEl.textContent = '0/50';
        });
        
        const sections = ['clinique', 'antecedents', 'biologie'];
        sections.forEach(sectionId => {
            const recorder = audioRecorders.get(sectionId);
            if (recorder && recorder.hasRecording()) {
                recorder.resetRecording();
            }
        });
    }
    
    updateSectionCount();
}

// ===== MODE SAISIE TEXTE =====

// Validation du mode mode DMI
function validateTexteMode() {
    const numeroDossier = document.getElementById('numeroDossierTexte').value.trim();
    const submitBtn = document.getElementById('submitTexte');
    
    if (submitBtn) {
        submitBtn.disabled = !numeroDossier;
    }
}

// Gestion de l'upload de photos
function initPhotosUpload() {
    const photosInput = document.getElementById('photosUpload');
    const photosPreview = document.getElementById('photosPreview');
    
    if (!photosInput || !photosPreview) return;
    
    photosInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        // Limiter à 5 photos
        if (uploadedPhotos.length + files.length > 5) {
            Toast.warning(`Vous avez atteint la limite de 5 photos. Supprimez des photos existantes pour en ajouter de nouvelles.`, 'Limite atteinte');
            return;
        }
        
        // Vérifier la taille et le format de chaque fichier
        files.forEach(file => {
            // Vérifier le format
            if (!file.type.startsWith('image/')) {
                Toast.error(`Le fichier "${file.name}" n'est pas une image valide.`, 'Format non supporté');
                return;
            }
            
            // Vérifier la taille (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                Toast.error(`Le fichier "${file.name}" est trop volumineux (${sizeMB} MB). Limite : 10 MB.`, 'Fichier trop lourd');
                return;
            }
            
            // Ajouter la photo
            uploadedPhotos.push(file);
        });
        
        // Réinitialiser l'input
        photosInput.value = '';
        
        // Mettre à jour la prévisualisation
        updatePhotosPreview();
    });
}

// Mettre à jour la prévisualisation des photos
function updatePhotosPreview() {
    const photosPreview = document.getElementById('photosPreview');
    if (!photosPreview) return;
    
    photosPreview.innerHTML = '';
    
    uploadedPhotos.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            photoItem.innerHTML = `
                <img src="${e.target.result}" alt="Photo ${index + 1}">
                <button class="photo-item-remove" data-index="${index}" title="Supprimer">×</button>
                <div class="photo-item-info">${file.name}</div>
            `;
            
            photosPreview.appendChild(photoItem);
            
            // Ajouter l'événement de suppression
            const removeBtn = photoItem.querySelector('.photo-item-remove');
            removeBtn.addEventListener('click', () => {
                uploadedPhotos.splice(index, 1);
                updatePhotosPreview();
            });
        };
        
        reader.readAsDataURL(file);
    });
}

// Envoi des données du mode mode DMI
async function sendTexteData() {
    try {
        const submitBtn = document.getElementById('submitTexte');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';

        // Préparer le payload
        const numeroDossier = document.getElementById('numeroDossierTexte').value.trim();
        const nomPatient = document.getElementById('nomPatientTexte').value.trim();
        const texteLibre = document.getElementById('texteLibre').value.trim();

        if (!numeroDossier) {
            Toast.warning('Le numéro de dossier est obligatoire pour envoyer les données.', 'Champ requis');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Envoyer les données';
            return;
        }

        const payload = {
            mode: 'texte',
            recordedAt: new Date().toISOString(),
            NumeroDeDossier: numeroDossier,
            NomDuPatient: nomPatient,
            texte: texteLibre,
            photos: []
        };

        // Convertir les photos en Base64
        for (const file of uploadedPhotos) {
            const base64 = await fileToBase64(file);
            payload.photos.push({
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                base64: base64
            });
        }

        // Envoyer au webhook du mode test
        const endpoint = 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            Toast.success('Vos données ont été envoyées avec succès !', 'Envoi réussi');
            
            // Réinitialiser le formulaire si souhaité
            if (confirm('Voulez-vous réinitialiser le formulaire ?')) {
                resetTexteForm();
            }
        } else {
            const errorText = await response.text();
            Toast.error(`Le serveur a renvoyé une erreur (${response.status}). Veuillez réessayer ou contactez le support.`, 'Erreur d\'envoi');
            console.error('Détails:', errorText);
        }

    } catch (error) {
        console.error('Erreur lors de l\'envoi:', error);
        Toast.error('Impossible de contacter le serveur. Vérifiez votre connexion Internet.', 'Erreur réseau');
    } finally {
        const submitBtn = document.getElementById('submitTexte');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Envoyer les données';
    }
}

// Convertir un fichier en Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Réinitialiser le formulaire mode DMI
function resetTexteForm() {
    document.getElementById('numeroDossierTexte').value = '';
    document.getElementById('nomPatientTexte').value = '';
    document.getElementById('texteLibre').value = '';
    document.getElementById('texteLibreCounter').textContent = '0';
    uploadedPhotos = [];
    updatePhotosPreview();
    validateTexteMode();
}

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de DictaMed...');
    
    // Initialiser le mode selon l'onglet actif
    initializeMode();
    
    // Initialiser les systèmes de base
    Toast.init();
    AutoSave.init();
    
    // Initialiser les composants
    initTabs();
    initCharCounters();
    initOptionalSection();
    initAudioRecorders();
    initPhotosUpload();
    updateSectionCount();
    validateTexteMode();

    // Événements pour les boutons d'envoi
    const submitNormalBtn = document.getElementById('submitNormal');
    const submitTestBtn = document.getElementById('submitTest');
    const submitTexteBtn = document.getElementById('submitTexte');

    if (submitNormalBtn) {
        submitNormalBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendData('normal').finally(() => Loading.hide());
        });
    }

    if (submitTestBtn) {
        submitTestBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendData('test').finally(() => Loading.hide());
        });
    }

    if (submitTexteBtn) {
        submitTexteBtn.addEventListener('click', () => {
            Loading.show('Envoi en cours...');
            sendTexteData().finally(() => Loading.hide());
        });
    }

    // Message de bienvenue
    setTimeout(() => {
        Toast.info('Bienvenue sur DictaMed ! Vos données sont sauvegardées automatiquement.', 'Bienvenue');
    }, 1000);

    console.log('✅ DictaMed initialisé avec succès!');
});


// ===== GESTION DE LA SAUVEGARDE DES DONNÉES D'AUTHENTIFICATION =====
const AuthManager = {
    STORAGE_KEY: 'dictamed_auth_credentials',
    
    // Sauvegarder les identifiants
    saveCredentials() {
        const username = document.getElementById('username')?.value.trim();
        const accessCode = document.getElementById('accessCode')?.value.trim();
        const rememberAuth = document.getElementById('rememberAuth')?.checked;
        
        if (rememberAuth && username && accessCode) {
            const credentials = {
                username: username,
                accessCode: accessCode,
                savedAt: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credentials));
                Toast.success('Vos informations d\'authentification ont été enregistrées.', 'Sauvegarde réussie');
                console.log('✅ Identifiants sauvegardés');
            } catch (e) {
                console.error('Erreur lors de la sauvegarde:', e);
                Toast.error('Impossible de sauvegarder vos identifiants.', 'Erreur');
            }
        } else if (!rememberAuth) {
            // Si la case est décochée, supprimer les identifiants sauvegardés
            this.clearCredentials();
        }
    },
    
    // Restaurer les identifiants au chargement
    restoreCredentials() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const credentials = JSON.parse(saved);
                const usernameInput = document.getElementById('username');
                const accessCodeInput = document.getElementById('accessCode');
                const rememberAuthCheckbox = document.getElementById('rememberAuth');
                
                if (usernameInput && accessCodeInput && rememberAuthCheckbox) {
                    usernameInput.value = credentials.username || '';
                    accessCodeInput.value = credentials.accessCode || '';
                    rememberAuthCheckbox.checked = true;
                    
                    console.log('✅ Identifiants restaurés');
                    Toast.info('Vos identifiants ont été restaurés automatiquement.', 'Bienvenue', 3000);
                }
            }
        } catch (e) {
            console.error('Erreur lors de la restauration:', e);
        }
    },
    
    // Effacer les identifiants
    clearCredentials() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('🗑️ Identifiants effacés');
        } catch (e) {
            console.error('Erreur lors de l\'effacement:', e);
        }
    },
    
    // Initialiser les event listeners
    init() {
        // Restaurer au chargement
        this.restoreCredentials();
        
        // Sauvegarder quand la checkbox change
        const rememberAuthCheckbox = document.getElementById('rememberAuth');
        if (rememberAuthCheckbox) {
            rememberAuthCheckbox.addEventListener('change', () => {
                if (rememberAuthCheckbox.checked) {
                    this.saveCredentials();
                } else {
                    this.clearCredentials();
                    Toast.info('Vos identifiants ne seront plus enregistrés.', 'Information');
                }
            });
        }
        
        // Sauvegarder quand les champs changent (si checkbox cochée)
        const usernameInput = document.getElementById('username');
        const accessCodeInput = document.getElementById('accessCode');
        
        [usernameInput, accessCodeInput].forEach(input => {
            if (input) {
                input.addEventListener('blur', () => {
                    const rememberAuth = document.getElementById('rememberAuth')?.checked;
                    if (rememberAuth) {
                        this.saveCredentials();
                    }
                });
            }
        });
    }
};

// Initialiser AuthManager après le chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});


// ===== PWA SERVICE WORKER =====
// Enregistrement du Service Worker pour PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker enregistré avec succès:', registration.scope);
                
                // Vérifier les mises à jour du Service Worker
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Nouvelle version du Service Worker détectée');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('✨ Nouvelle version disponible. Rechargez la page pour mettre à jour.');
                            Toast.info('Une nouvelle version est disponible. Rechargez la page pour mettre à jour.', 'Mise à jour', 0);
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Échec de l\'enregistrement du Service Worker:', error);
            });
    });

    // Gérer les mises à jour du Service Worker
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            window.location.reload();
            refreshing = true;
        }
    });
}

// ===== INSTALLATION PWA =====
let deferredPrompt;
const installButton = document.getElementById('installPwaBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Événement beforeinstallprompt déclenché');
    // Empêcher l'affichage automatique de la bannière d'installation
    e.preventDefault();
    // Stocker l'événement pour l'utiliser plus tard
    deferredPrompt = e;
    
    // Afficher le bouton d'installation
    if (installButton) {
        installButton.classList.remove('hidden');
        
        // Animation d'apparition
        setTimeout(() => {
            installButton.style.opacity = '0';
            installButton.style.transform = 'scale(0.9)';
            installButton.style.transition = 'all 0.3s ease';
            requestAnimationFrame(() => {
                installButton.style.opacity = '1';
                installButton.style.transform = 'scale(1)';
            });
        }, 100);
    }
});

// Gérer le clic sur le bouton d'installation
if (installButton) {
    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) {
            Toast.info('L\'application est déjà installée ou votre navigateur ne supporte pas l\'installation.', 'Installation');
            return;
        }
        
        // Afficher la boîte de dialogue d'installation
        deferredPrompt.prompt();
        
        // Attendre la réponse de l'utilisateur
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Installation PWA: ${outcome}`);
        
        if (outcome === 'accepted') {
            Toast.success('DictaMed a été installé avec succès ! Vous pouvez maintenant l\'utiliser comme une application native.', 'Installation réussie', 8000);
        } else {
            Toast.info('Installation annulée. Vous pouvez toujours utiliser DictaMed depuis votre navigateur.', 'Installation', 5000);
        }
        
        // Réinitialiser le prompt (ne peut être utilisé qu'une fois)
        deferredPrompt = null;
        installButton.classList.add('hidden');
    });
}

window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installée avec succès!');
    Toast.success('DictaMed a été ajouté à votre écran d\'accueil !', 'Installation réussie', 5000);
    deferredPrompt = null;
    if (installButton) {
        installButton.classList.add('hidden');
    }
});

// ===== MASQUER LE MESSAGE DE SWIPE APRÈS INTERACTION =====
const tabsContainer = document.querySelector('.tabs-container');
const swipeHint = document.querySelector('.swipe-hint');

if (tabsContainer && swipeHint) {
    let hasScrolled = false;
    
    tabsContainer.addEventListener('scroll', () => {
        if (!hasScrolled) {
            hasScrolled = true;
            swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => {
                swipeHint.style.display = 'none';
            }, 500);
        }
    });
    
    // Masquer également après 10 secondes si pas de scroll
    setTimeout(() => {
        if (!hasScrolled && swipeHint) {
            swipeHint.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => {
                swipeHint.style.display = 'none';
            }, 500);
        }
    }, 10000);
}
