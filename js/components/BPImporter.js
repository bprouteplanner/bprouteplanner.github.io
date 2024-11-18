class BPImporter {
    constructor(state) {
        this.state = state;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const importButton = document.getElementById('importBPButton');
        if (importButton) {
            importButton.addEventListener('click', () => this.handleImport());
        }

        const bpImportArea = document.getElementById('bpImportArea');
        if (bpImportArea) { 
            bpImportArea.addEventListener('input', () => this.handleImport());
        
        }
    }

    extractBPNumbers(text) {
        const bpRegex = /BP202\d-\d{5}/g;
        return [...new Set(text.match(bpRegex) || [])];
    }

    async handleImport() {
        const importButton = document.getElementById('importBPButton');
        const textarea = document.getElementById('bpImportArea');

        try {
            if (!textarea) {
                throw new Error('Import textarea not found');
            }

            const text = textarea.value;
            const bpNumbers = this.extractBPNumbers(text);

            if (bpNumbers.length === 0) {
                alert('No valid BP numbers found. Please ensure BP numbers are in format BP202#-#####');
                return;
            }

            if (this.state.callList.some(item => item.bpNumber)) {
                if (!confirm('This will clear existing BP numbers. Do you want to proceed?')) {
                    return;
                }
            }

            if (importButton) {
                importButton.disabled = true;
                importButton.textContent = 'Importing...';
            }

            // Create new call list with extracted BP numbers
            this.state.callList = bpNumbers.map((bpNumber, index) => ({
                rank: index + 1,
                bpNumber: bpNumber,
                address: "",
                description: "",
                lat: null,
                lon: null
            }));

            // Update URL first
            this.state.updateURL();
            
            // Then fetch details and trigger render
            await this.state.refreshAllBPData();

            // Clear textarea and show success message
            textarea.value = `Successfully imported ${bpNumbers.length} BP numbers. Paste new BP's to replace existing.`;


        } catch (error) {
            console.error('Import failed:', error);
            alert('Error during import. Please try again.');
        } finally {
            if (importButton) {
                importButton.disabled = false;
                importButton.textContent = 'Import BP Numbers';
            }
        }
    }
}