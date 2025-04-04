// Referencias a elementos DOM
const fileInput = document.getElementById('fileInput');
const selectPhotoBtn = document.getElementById('selectPhotoBtn');
const takePhotoBtn = document.getElementById('takePhotoBtn');
const imagePreview = document.getElementById('imagePreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const results = document.getElementById('results');
const canvas = document.getElementById('canvas');
const video = document.getElementById('video');
const cameraContainer = document.getElementById('cameraContainer');
const captureBtn = document.getElementById('captureBtn');
const cancelCameraBtn = document.getElementById('cancelCameraBtn');

// Porcentajes de colores
let colorPercentages = {
    white: 0,
    yellow: 0,
    orange: 0,
    brown: 0,
    black: 0
};

// Configurar eventos
selectPhotoBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleImageUpload);
analyzeBtn.addEventListener('click', analyzeImage);
takePhotoBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', captureImage);
cancelCameraBtn.addEventListener('click', stopCamera);

// Manejo de carga de imágenes
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
            analyzeBtn.style.display = 'inline-block';
            results.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// Función para iniciar la cámara
function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                video.srcObject = stream;
                cameraContainer.style.display = 'block';
                imagePreview.style.display = 'none';
                analyzeBtn.style.display = 'none';
            })
            .catch(function(error) {
                console.error("Error al acceder a la cámara: ", error);
                alert("No se pudo acceder a la cámara. Por favor, utiliza la opción de seleccionar foto.");
            });
    } else {
        alert("Tu navegador no soporta acceso a la cámara. Por favor, utiliza la opción de seleccionar foto.");
    }
}

// Función para detener la cámara
function stopCamera() {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
    cameraContainer.style.display = 'none';
}

// Función para capturar imagen de la cámara
function captureImage() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    imagePreview.src = canvas.toDataURL('image/png');
    imagePreview.style.display = 'block';
    analyzeBtn.style.display = 'inline-block';
    
    stopCamera();
}

// Convertir RGB a HSV
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const v = max;
    
    if (delta === 0) {
        h = 0;
    } else if (max === r) {
        h = ((g - b) / delta) % 6;
    } else if (max === g) {
        h = (b - r) / delta + 2;
    } else {
        h = (r - g) / delta + 4;
    }
    
    h = h / 6;
    if (h < 0) h += 1;
    
    return { h, s, v };
}

// Analizar la imagen
function analyzeImage() {
    const img = new Image();
    img.onload = function() {
        // Redimensionar para procesar más rápido
        const maxDimension = 500;
        let width, height;
        
        if (img.width > img.height) {
            width = maxDimension;
            height = (img.height / img.width) * maxDimension;
        } else {
            height = maxDimension;
            width = (img.width / img.height) * maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Obtener datos de píxeles
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        
        // Contadores de colores
        let whiteCount = 0;
        let yellowCount = 0;
        let orangeCount = 0;
        let brownCount = 0;
        let blackCount = 0;
        
        // Analizar cada píxel
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            // Convertir a HSV para mejor clasificación
            const hsv = rgbToHsv(r, g, b);
            
            // Clasificar colores (aproximadamente según las gamas solicitadas)
            if (hsv.s < 0.15 && hsv.v > 0.8) {
                whiteCount++; // Blanco (baja saturación, alto valor)
            } else if (hsv.s < 0.15 && hsv.v < 0.2) {
                blackCount++; // Negro (baja saturación, bajo valor)
            } else if (hsv.h >= 0.11 && hsv.h <= 0.17 && hsv.s > 0.5 && hsv.v > 0.5) {
                yellowCount++; // Amarillo
            } else if (hsv.h >= 0.05 && hsv.h <= 0.11 && hsv.s > 0.5 && hsv.v > 0.5) {
                orangeCount++; // Naranja
            } else if (hsv.h >= 0.02 && hsv.h <= 0.08 && hsv.s > 0.3 && hsv.v < 0.6) {
                brownCount++; // Marrón
            }
        }
        
        // Calcular total y porcentajes
        const totalColorPixels = whiteCount + yellowCount + orangeCount + brownCount + blackCount;
        
        if (totalColorPixels > 0) {
            colorPercentages.white = (whiteCount / totalColorPixels) * 100;
            colorPercentages.yellow = (yellowCount / totalColorPixels) * 100;
            colorPercentages.orange = (orangeCount / totalColorPixels) * 100;
            colorPercentages.brown = (brownCount / totalColorPixels) * 100;
            colorPercentages.black = (blackCount / totalColorPixels) * 100;
            
            // Calcular acumulado
            const acumulado = 
                colorPercentages.orange + 
                colorPercentages.brown + 
                colorPercentages.black;
            
            // Actualizar interfaz
            updateResults(colorPercentages, acumulado);
        }
    };
    
    img.src = imagePreview.src;
}

// Actualizar resultados en la interfaz
function updateResults(percentages, acumulado) {
    // Actualizar barras y porcentajes
    document.getElementById('whiteBar').style.width = percentages.white + '%';
    document.getElementById('yellowBar').style.width = percentages.yellow + '%';
    document.getElementById('orangeBar').style.width = percentages.orange + '%';
    document.getElementById('brownBar').style.width = percentages.brown + '%';
    document.getElementById('blackBar').style.width = percentages.black + '%';
    
    document.getElementById('whitePercentage').textContent = percentages.white.toFixed(1) + '%';
    document.getElementById('yellowPercentage').textContent = percentages.yellow.toFixed(1) + '%';
    document.getElementById('orangePercentage').textContent = percentages.orange.toFixed(1) + '%';
    document.getElementById('brownPercentage').textContent = percentages.brown.toFixed(1) + '%';
    document.getElementById('blackPercentage').textContent = percentages.black.toFixed(1) + '%';
    
    document.getElementById('acumuladoPercentage').textContent = acumulado.toFixed(1) + '%';
    
    // Mostrar resultados
    results.style.display = 'block';
}