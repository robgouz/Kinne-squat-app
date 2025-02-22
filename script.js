// Vérifie que TensorFlow.js est bien chargé
if (!window.poseDetection) {
    console.error("TensorFlow.js ou Pose Detection Model non chargé !");
}

// Sélection des éléments HTML
const video = document.getElementById('video');
const statusText = document.createElement('p');
document.body.appendChild(statusText);

// Création du canevas pour dessiner les repères
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Fonction pour initialiser la caméra
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise(resolve => {
        video.onloadedmetadata = () => resolve(video);
    });
}

// Chargement du modèle MoveNet
async function loadModel() {
    return await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
}

// Fonction pour dessiner les points du corps
function drawKeypoints(keypoints) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    keypoints.forEach(keypoint => {
        if (keypoint.score > 0.3) {
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
        }
    });
}

// Fonction de détection du squat
async function detectSquat(detector) {
    const poses = await detector.estimatePoses(video);
    
    if (poses.length > 0) {
        const keypoints = poses[0].keypoints;
        drawKeypoints(keypoints); // Afficher les points

        // Récupération des positions des hanches et genoux
        const hip = keypoints.find(k => k.name === 'left_hip');
        const knee = keypoints.find(k => k.name === 'left_knee');

        if (hip && knee) {
            if (knee.y > hip.y + 50) {
                statusText.innerText = "✅ Squat détecté ! Remontez.";
                speak("Squat détecté !");
            } else {
                statusText.innerText = "⬆️ Remontez.";
                speak("Remontez.");
            }
        }
    }
    requestAnimationFrame(() => detectSquat(detector));
}

// Synthèse vocale
function speak(text) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
    } else {
        console.error("Synthèse vocale non supportée.");
    }
}

// Lancement du programme
setupCamera().then(() => {
    video.play();
    loadModel().then(detector => detectSquat(detector));
});
