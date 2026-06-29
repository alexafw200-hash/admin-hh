const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');
const resultContainer = document.getElementById('resultContainer');

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone when item is dragged over it
['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropzone.classList.add('dragover');
}

function unhighlight() {
    dropzone.classList.remove('dragover');
}

// Handle dropped files
dropzone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length) {
        handleFiles(files[0]);
    }
}

// Handle file input selection
fileInput.addEventListener('change', function() {
    if (this.files.length) {
        handleFiles(this.files[0]);
    }
});

function handleFiles(file) {
    if (file.type !== 'application/pdf') {
        alert('الرجاء رفع ملف بصيغة PDF فقط.');
        return;
    }
    uploadFile(file);
}

function uploadFile(file) {
    // Reset UI
    resultContainer.style.display = 'none';
    progressContainer.style.display = 'block';
    progressFill.style.width = '10%';
    statusText.innerText = 'جاري رفع الملف للسيرفر...';

    const formData = new FormData();
    formData.append('pdf', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);
    
    // Response type must be blob so we can download the HTML file properly
    xhr.responseType = 'blob';

    xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            // Upload progress maxes out at 50%
            const percentComplete = (e.loaded / e.total) * 50;
            progressFill.style.width = percentComplete + '%';
            if (percentComplete === 50) {
                statusText.innerText = 'جاري تحويل ومعالجة الملف...';
                // Fake processing progress
                let p = 50;
                window.fakeProgressInterval = setInterval(() => {
                    p += Math.random() * 5;
                    if (p > 95) {
                        clearInterval(window.fakeProgressInterval);
                    } else {
                        progressFill.style.width = p + '%';
                    }
                }, 500);
            }
        }
    });

    xhr.onload = function() {
        if (window.fakeProgressInterval) clearInterval(window.fakeProgressInterval);
        if (xhr.status === 200) {
            progressFill.style.width = '100%';
            statusText.innerText = 'تم التحويل بنجاح!';
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                resultContainer.style.display = 'block';
            }, 1000);

            // Handle the file download
            const blob = xhr.response;
            const url = window.URL.createObjectURL(blob);
            
            // Extract filename from headers if possible, otherwise use default
            const disposition = xhr.getResponseHeader('Content-Disposition');
            let filename = "output.html";
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
        } else {
            progressContainer.style.display = 'none';
            alert('حدث خطأ أثناء معالجة الملف.');
        }
        
        // Reset file input
        fileInput.value = '';
    };

    xhr.onerror = function() {
        progressContainer.style.display = 'none';
        alert('فشل الاتصال بالسيرفر.');
        fileInput.value = '';
    };

    xhr.send(formData);
}
