let filteredData = [];

function processFile() {
    const fileInput = document.getElementById('fileUpload');
    const machineFileInput = document.getElementById('machineFile');
    const dateInput = document.getElementById('date').value;
    const periodInput = document.getElementById('periode').value;
    const valueInput = document.getElementById('valeur').value;
    const inclure_1_9 = document.getElementById('inclure_1_9').checked;
    const joinMachines = document.getElementById('join_machines').checked;
    const file = fileInput.files[0];

    if (!file || !dateInput || !valueInput) {
        alert("Veuillez télécharger un fichier et remplir tous les champs.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Get the start period for filtering
        const today = new Date(dateInput.split("/").reverse().join("-"));
        const startPeriod = getPeriod(today, periodInput, valueInput);

        // Filter the telemetry data based on the period and sales
        filteredData = jsonData.filter(row => {
            const rowDate = new Date(row['Date_Debut']);
            return rowDate >= startPeriod && (inclure_1_9 ? row['Val. Ref'] > 1.9 : row['Val. Ref'] > 1.8);
        });

        if (joinMachines && machineFileInput.files.length > 0) {
            handleMachineFile(machineFileInput.files[0], jsonData);
        }

        document.getElementById('machineCount').textContent = filteredData.length;
        document.getElementById('resultContainer').style.display = 'block';
    };

    reader.readAsArrayBuffer(file);
}

function handleMachineFile(machineFile, jsonData) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        const machineData = Papa.parse(csvContent, {
            header: true,
            delimiter: ';'
        }).data;

        const allMachines = new Set(machineData.map(row => row['Nom de la machine']));
        const machinesInTelemetry = new Set(jsonData.map(row => row['Tiers']));
        const missingMachines = [...allMachines].filter(machine => !machinesInTelemetry.has(machine));

        // Add missing machines with NULL sales data
        missingMachines.forEach(machine => {
            filteredData.push({
                'Tiers': machine,
                'Val. Ref': null,
                'Commentaire': 'Machine non trouvée dans les ventes',
                'N°Pièce': null,
                'Code postal': null,
                'Ville': null,
            });
        });
    };
    reader.readAsText(machineFile);
}

function getPeriod(today, period, value) {
    const val = parseInt(value);
    if (period === 'semaine') {
        return new Date(today.setDate(today.getDate() - val * 7));
    } else if (period === 'mois') {
        return new Date(today.setMonth(today.getMonth() - val));
    } else {
        return new Date(today.setDate(today.getDate() - val));
    }
}

function downloadCSV() {
    const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(e => Object.values(e).join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filtered_machines.csv");
    document.body.appendChild(link);
    link.click();
}
