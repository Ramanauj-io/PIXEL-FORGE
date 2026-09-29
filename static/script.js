// Show the file name when a user selects an image
document.getElementById('imageInput').addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        document.getElementById('fileName').innerText = "Selected: " + e.target.files[0].name;
        document.getElementById('fileName').style.color = "#10b981"; // Green color
    }
});

async function startProcessing() {
    const fileInput = document.getElementById('imageInput');
    const sensor = document.getElementById('sensor').value;
    
    if (fileInput.files.length === 0) {
        alert("Please upload an image first!");
        return;
    }

    // 1. Hide upload section, show processing section
    document.getElementById('upload-section').classList.add('hidden');
    document.getElementById('processing').classList.remove('hidden');

    // 2. Animate a fake progress bar so the user knows it's working
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if(progress <= 90) {
            document.getElementById('progressBar').style.width = progress + "%";
            document.getElementById('progressValue').innerText = progress + "%";
        }
    }, 300);

    // 3. Prepare the file to send to Python
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("sensor", sensor);

    try {
        // 4. Send it to the FastAPI backend!
        const response = await fetch("http://127.0.0.1:8000/api/process", {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();

        // Stop the loading bar
        clearInterval(interval);

        if(data.status === "success") {
            // Finish progress bar
            document.getElementById('progressBar').style.width = "100%";
            document.getElementById('progressValue').innerText = "100%";

            // 5. Wait a second, hide processing, show the map results
            setTimeout(() => {
                document.getElementById('processing').classList.add('hidden');
                document.getElementById('map-section').classList.remove('hidden');
                
                // Show the images returned from Python
                document.getElementById('beforeImage').src = data.original_image_url;
                document.getElementById('afterImage').src = data.super_res_image_url;
            }, 800);
        } else {
            alert("Error from server: " + data.message);
            location.reload(); // reload page on error
        }
    } catch (error) {
        clearInterval(interval);
        console.error("Connection Error:", error);
        alert("Could not connect to the Python server. Did you start it in the terminal?");
        location.reload();
    }
}