function speak(text) {
    if ('speechSynthesis' in window) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';  // Langue en français
        utterance.volume = 1; // Volume max
        utterance.rate = 1; // Vitesse normale
        utterance.pitch = 1; // Hauteur normale
        speechSynthesis.speak(utterance);
    } else {
        console.error("Synthèse vocale non supportée par ce navigateur.");
    }
}

// Test immédiat au chargement de la page
window.onload = function() {
    speak("Bienvenue, test de la voix !");
};
const video = document.getElementById('video');
const canvas = document.getElementById('output');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status');

let squatPosition = false;

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(video);
    });
}

async function detectPose() {
    const model = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: 'tfjs',
    });

    function speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }

    async function runDetection() {
        const poses = await model.estimatePoses(video);
        if (poses.length > 0) {
            const keypoints = poses[0].keypoints;
            const hip = keypoints.find(k => k.name === 'left_hip');
            const knee = keypoints.find(k => k.name === 'left_knee');
            if (hip && knee) {
                const hipY = hip.y;
                const kneeY = knee.y;

                if (!squatPosition && kneeY > hipY + 50) {
                    squatPosition = true;
                    statusText.innerText = "Squat détecté ! Remontez maintenant.";
                    speak("Squat détecté ! Remontez maintenant.");
                } else if (squatPosition && kneeY < hipY) {
                    squatPosition = false;
                    statusText.innerText = "Retour en position debout.";
                    speak("Retour en position debout.");
                }
            }
        }
        requestAnimationFrame(runDetection);
    }

    runDetection();
}

setupCamera().then(() => {
    video.play();
    detectPose();
});
