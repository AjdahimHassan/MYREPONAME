let filteredData = [];

function processFile() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process the data (filter machines with 0 sales)
        filteredData = jsonData.filter(row => row['Val. Ref'] === 0);

        // Display results
        document.getElementById('machineCount').textContent = filteredData.length;
        document.getElementById('resultContainer').style.display = 'block';
    };

    if (file) {
        reader.readAsArrayBuffer(file);
    } else {
        alert("Veuillez télécharger un fichier.");
    }
}

function downloadCSV() {
    const csvContent = "data:text/csv;charset=utf-8,"
        + filteredData.map(e => Object.values(e).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filtered_machines.csv");
    document.body.appendChild(link);
    link.click();
}
