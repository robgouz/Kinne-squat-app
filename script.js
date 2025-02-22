// Initialisation de la caméra
const video = document.getElementById('video');
const statusText = document.getElementById('status');

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video);
    });
}

// Création du canevas pour afficher les points
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

async function loadModel() {
    return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
}

// Fonction pour dessiner les points de détection sur le corps
function drawKeypoints(keypoints) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    keypoints.forEach(keypoint => {
        if (keypoint.score > 0.3) { // Seulement si la détection est sûre
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
        }
    });
}

async function detectSquat(detector) {
    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        drawKeypoints(keypoints); // Affiche les points

        const hip = keypoints.find(k => k.name === 'left_hip');
        const knee = keypoints.find(k => k.name === 'left_knee');

        if (hip && knee) {
            if (knee.y > hip.y + 50) {
                statusText.innerText = "Squat détecté ! Remontez.";
                speak("Squat détecté !");
            } else {
                statusText.innerText = "Retour en position debout.";
                speak("Retour en position debout.");
            }
        }
    }
    requestAnimationFrame(() => detectSquat(detector));
}

// Fonction pour la synthèse vocale
function speak(text) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
    }
}

// Exécution du script
setupCamera().then(() => {
    video.play();
    loadModel().then(detector => detectSquat(detector));
});
