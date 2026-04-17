let masterData = [];
let allTools = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupSearch();
});

async function loadData() {
    try {
        const response = await fetch('../data/tools.json');
        const data = await response.json();
        
        // Flatten constraints
        data.categories.forEach(category => {
            const catObj = {
                name: category.name,
                description: category.description,
                tools: []
            };
            
            if (category.tools && category.tools.length > 0) {
                catObj.tools.push(...category.tools);
            }
            
            if (category.subcategories) {
                category.subcategories.forEach(sub => {
                    if (sub.tools) {
                        catObj.tools.push(...sub.tools);
                    }
                });
            }
            
            masterData.push(catObj);
            allTools.push(...catObj.tools);
        });

        document.getElementById('categoryCount').innerText = masterData.length;
        renderSidebar();
        renderTools(allTools, "All Tools");
        
    } catch (e) {
        console.error("Failed to load tools.json", e);
        document.getElementById('toolsGrid').innerHTML = `<p style="color:red;">Failed to load data. Ensure you are running this via a dev server (e.g., Python HTTP Server) and not opening the HTML file directly.</p>`;
    }
}

function renderSidebar() {
    const list = document.getElementById('categoryList');
    
    // Add "All" button
    const allLi = document.createElement('li');
    allLi.className = 'category-item active';
    allLi.innerText = 'All Categories';
    allLi.onclick = () => {
        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        allLi.classList.add('active');
        document.getElementById('searchInput').value = '';
        renderTools(allTools, "All Tools");
    };
    list.appendChild(allLi);

    masterData.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.innerText = cat.name;
        li.onclick = () => {
            document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
            li.classList.add('active');
            document.getElementById('searchInput').value = '';
            renderTools(cat.tools, cat.name);
        };
        list.appendChild(li);
    });
}

function renderTools(toolsToRender, title) {
    const grid = document.getElementById('toolsGrid');
    document.getElementById('currentCategoryTitle').innerText = title;
    document.getElementById('resultsCount').innerText = `${toolsToRender.length} tools found`;
    
    grid.innerHTML = '';
    
    if (toolsToRender.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <p class="tool-desc" style="font-size:1.1rem; margin-bottom:1rem;">No tools found matching your search.</p>
                <button class="tool-link-btn" onclick="setSearchQuery('')">Clear Search</button>
            </div>
        `;
        return;
    }

    toolsToRender.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        
        let tagsHtml = '';
        
        if (tool.personal_pick) {
            tagsHtml += `<span class="tool-tag personal-pick" onclick="setSearchQuery('⭐ Personal Pick')">⭐ Personal Pick</span>`;
        }
        
        if (tool.tags) {
            tool.tags.forEach(tag => {
                let cleanTag = tag.trim().replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                cleanTag = cleanTag.replace('Mac Only', 'Mac');
                tagsHtml += `<span class="tool-tag" onclick="setSearchQuery('${cleanTag}')">${cleanTag}</span>`;
            });
        }

        card.innerHTML = `
            <div class="tool-header">
                <a href="${tool.url}" target="_blank" class="tool-title">${tool.name}</a>
                <a href="${tool.url}" target="_blank" class="tool-link-btn">
                    Visit Site <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </a>
            </div>
            <p class="tool-desc">${tool.description}</p>
            <div class="tool-footer">
                ${tagsHtml}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Reset sidebar visually
        document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
        document.querySelector('.category-item').classList.add('active'); // First item is "All"

        if (query === '') {
            renderTools(allTools, "All Tools");
            return;
        }

        const filtered = allTools.filter(tool => {
            // Special handler for Personal Picks
            if (query.includes('personal pick') || query.includes('⭐')) {
                return tool.personal_pick && tool.personal_pick.length > 0;
            }
            
            const nameMatch = tool.name.toLowerCase().includes(query);
            const descMatch = tool.description.toLowerCase().includes(query);
            
            // Check formatted tags manually since that's what the user clicks
            let tagMatch = false;
            if (tool.tags) {
                tagMatch = tool.tags.some(t => {
                    let cleanTag = t.trim().replace('-', ' ').toLowerCase();
                    return cleanTag.includes(query) || query.includes(cleanTag);
                });
            }
            return nameMatch || descMatch || tagMatch;
        });

        renderTools(filtered, `Search Results for "${query}"`);
    });
}

// Global function to pick a random tool
window.feelingLucky = function() {
    const randomTool = allTools[Math.floor(Math.random() * allTools.length)];
    setSearchQuery(randomTool.name);
};

// Expose globally for quick filters
window.setSearchQuery = function(query) {
    const input = document.getElementById('searchInput');
    input.value = query;
    // Trigger input event to run search filtering
    input.dispatchEvent(new Event('input'));
    
    // Scroll to top of results smoothly
    window.scrollTo({
        top: document.querySelector('.results-header').offsetTop - 100,
        behavior: 'smooth'
    });
};
