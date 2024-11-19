class TableManager {
    constructor(state, mapManager) {
        this.state = state;
        this.mapManager = mapManager;
        this.draggedItem = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add any global table event listeners here
        const addRowButton = document.getElementById('addRowButton');
        if (addRowButton) {
            addRowButton.addEventListener('click', () => {
                this.addRow();
            });
        }
    }

    addRow() {
        const newRank = this.state.callList.length + 1;
        this.state.callList.push({
            rank: newRank,
            bpNumber: "",
            address: "",
            description: "",
            lat: null,
            lon: null
        });
        this.state.updateURL();
        this.renderTable();
    }

    renderTable() {
        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = '';
        
        // Sort the callList by rank before rendering
        const sortedList = [...this.state.callList].sort((a, b) => a.rank - b.rank);
        
        sortedList.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.draggable = true;
            tr.className = `${row.permittype}-row`;
            tr.innerHTML = `
                <td>
                    <span class="drag-handle">☰</span>
                    <input class="rank-input" type="number" value="${row.rank}">
                </td>
                <td>
                    <input class="bp-input" type="text" value="${row.bpNumber}">
                </td>
                <td>${row.address || ''}</td>
                <td>${row.description || ''}</td>
                <td>
                    <button class="delete-button" type="button" data-index="${index}">✖</button>
                </td>
            `;
            // Add event listeners
            const BPNumberInput = tr.querySelector('.bp-input');
            if (BPNumberInput) {
                BPNumberInput.addEventListener('input', (e) => {
                  if (CONFIG.BP_FORMAT.test(e.target.value)) {
                        this.updateBPNumber(index, e.target.value);
                    } 
                });
            }

            const rankInput = tr.querySelector('.rank-input');
            rankInput.addEventListener('change', (e) => {
                console.log(index, e.target.value);
                this.updateRank(index, e.target.value);
            });
  
            const deleteButton = tr.querySelector('.delete-button');
            if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                this.deleteRow(idx);
            });
        }

            this.attachDragListeners(tr);
            tableBody.appendChild(tr);
        });

        // Update markers and route link after table update
        if (this.mapManager) {
            this.mapManager.updateMarkers();
        }
        this.updateRouteLink();
    }

    attachDragListeners(tr) {
        tr.addEventListener('dragstart', this.handleDragStart.bind(this));
        tr.addEventListener('dragover', this.handleDragOver.bind(this));
        tr.addEventListener('drop', this.handleDrop.bind(this));
        tr.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    handleDragStart(e) {
        this.draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    }

    handleDragOver(e) {
        e.preventDefault();
        const tr = e.target.closest('tr');
        if (tr && tr !== this.draggedItem) {
            const tableBody = document.getElementById('tableBody');
            const children = Array.from(tableBody.children);
            const draggedIndex = children.indexOf(this.draggedItem);
            const targetIndex = children.indexOf(tr);
            
            if (draggedIndex < targetIndex) {
                tr.parentNode.insertBefore(this.draggedItem, tr.nextSibling);
            } else {
                tr.parentNode.insertBefore(this.draggedItem, tr);
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.updateRanksAfterDrag();
    }

    updateRanksAfterDrag() {
        try {
            const rows = document.querySelectorAll('#tableBody tr');
            const newOrder = [];

            // Collect all BP numbers in their new order
            rows.forEach((row, newIndex) => {
                const bpNumberInput = row.querySelector('input[type="text"]');
                const bpNumber = bpNumberInput.value;
                newOrder.push({
                    bpNumber,
                    newRank: newIndex + 1
                });
            });

            // Update the callList with new ranks
            newOrder.forEach(({bpNumber, newRank}) => {
                const item = this.state.callList.find(item => item.bpNumber === bpNumber);
                if (item) {
                    item.rank = newRank;
                }
            });

            // Sort the callList based on the new ranks
            this.state.callList.sort((a, b) => a.rank - b.rank);

            // Update URL and trigger re-render
            this.state.updateURL();
            this.renderTable();

        } catch (error) {
            console.error('Error updating ranks after drag:', error);
            // Revert to original order by re-rendering
            this.renderTable();
        }
    }

    deleteRow(index) {
        try {
            if (isNaN(index) || index < 0 || index >= this.state.callList.length) {
                console.error('Invalid index for deletion:', index);
                return;
            }

                // Remove the row from state
                this.state.callList.splice(index, 1);

                // Reorder ranks
                this.state.callList.forEach((item, i) => {
                    item.rank = i + 1;
                });

                // Update URL
                this.state.updateURL();

                // Render the updated table
                this.renderTable();
            
        } catch (error) {
            console.error('Error deleting row:', error);
            alert('An error occurred while deleting the row. Please try again.');
        }
    }

    updateRank(index, newRank) {
        const updatedRank = parseInt(newRank);
        if (isNaN(updatedRank) || updatedRank < 1) return;
        
        // Get current item and its old rank
        const itemToUpdate = this.state.callList[index];
        if (!itemToUpdate) return;
        const oldRank = itemToUpdate.rank;
        
        // Ensure rank is within valid range
        const maxRank = this.state.callList.length;
        const validRank = Math.min(Math.max(updatedRank, 1), maxRank);
        
        // Create new array with updated positions
        const newList = [...this.state.callList];
        
        // Remove item from its current position
        newList.splice(index, 1);
        
        // Insert item at new position (rank - 1 because array is 0-based)
        newList.splice(validRank - 1, 0, itemToUpdate);
        
        // Update all ranks to match new positions
        newList.forEach((item, idx) => {
            item.rank = idx + 1;
        });
        
        // Update the state
        this.state.callList = newList;
        
        // Update URL and render
        this.state.updateURL();
        this.renderTable();
    }

    async updateBPNumber(index, newBPNumber) {
        await this.state.updateBPNumber(index, newBPNumber);
        this.renderTable();
    }

    updateRouteLink() {
        const validRows = this.state.callList
            .filter(row => row.lat && row.lon)
            .sort((a, b) => a.rank - b.rank);

        if (validRows.length === 0) return;

        const lastRow = validRows[validRows.length - 1];
        const waypoints = validRows
            .slice(0, -1)
            .map(row => `${row.lat},${row.lon}`)
            .slice(0, CONFIG.MAX_WAYPOINTS)
            .join('|');

        const url = `${CONFIG.GOOGLE_ROUTE_URL}&origin=Current+Location&destination=${lastRow.lat},${lastRow.lon}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

        document.getElementById('link').innerHTML = `<a target="_blank" href="${encodeURI(url)}">Google Maps Route Link</a>`;
    }

    handleRankKeydown(index, event) {
        if (event.key === 'ArrowUp') {
            event.preventDefault(); // Prevent default increment
            if (index > 0) { // Can't move up if already at top
                this.updateRank(index, index + 1);
            }
            return false;
        } else if (event.key === 'ArrowDown') {
            event.preventDefault(); // Prevent default decrement
            if (index < this.callList.length - 1) {
                updateRank(index, index - 1);
            }
            return false;
        }
        return true;
    }
}