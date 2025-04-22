document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    
    // Character stats
    let characterStats = {
        vitality: 100,
        maxVitality: 100,
        madness: 0,
        maxMadness: 100,
        location: "Slums of Calypso"
    };
    
    // Game state
    let conversationHistory = []; 
    
    // Initialize
    createParticles();
    addInitialMessage();
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Create floating particles effect
    function createParticles() {
        const floatingParticles = document.querySelector('.floating-particles');
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            // Random size
            const size = Math.random() * 8 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.bottom = `-${size}px`;
            
            // Random animation duration and delay
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 15;
            particle.style.animation = `float ${duration}s infinite linear ${delay}s`;
            
            floatingParticles.appendChild(particle);
        }
    }
    
    // Add intro message
    function addInitialMessage() {
        // Add initial message
        addMessage('narrator', null, 'You awaken in the grotesque slums of Calypso, surrounded by broken angels and augmented demons. Your mind is foggy, but you can sense there\'s more to this city than suffering...');
        
        setTimeout(() => {
            const npcMessage = 'A hollow seeker, aren\'t you? Empty, wandering... Just like the rest of us. The <span class="demonic-text">Queen of Demons</span> has changed everything. The city was always dark, but now... now it\'s something else entirely.';
            
            addMessage('npc', 'Augmented Demon', npcMessage);
            
            // Add first choices
            addChoices([
                "Who is this Queen of Demons you speak of?",
                "What happened to you? Your body...",
                "I need to find my way out of these slums."
            ]);
        }, 1500);
    }
    
    // Handle sending messages
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add player message to UI
        addMessage('player', 'You', message);
        
        // Add to conversation history for the API
        conversationHistory.push({
            role: "user",
            content: message
        });
        
        // Clear input
        userInput.value = '';
        
        // Remove any existing choice buttons
        const existingChoices = document.querySelector('.choice-buttons');
        if (existingChoices) {
            existingChoices.remove();
        }
        
        // Send to API (placeholder)
        getResponseFromGPT(message);
    }
    
    // Add a message to the chat
    function addMessage(type, sender, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        if (type === 'player') {
            messageElement.classList.add('player-message');
        } else if (type === 'npc') {
            messageElement.classList.add('npc-message');
        } else if (type === 'narrator') {
            messageElement.classList.add('narrator-message');
        } else if (type === 'enemy') {
            messageElement.classList.add('enemy-message');
        }
        
        let messageHTML = '';
        
        if (sender) {
            messageHTML += `<div class="message-sender">${sender}</div>`;
        }
        
        messageHTML += `<div class="message-content">${content}</div>`;
        messageElement.innerHTML = messageHTML;
        
        chatMessages.appendChild(messageElement);
        
        // Scroll to bottom
        scrollToBottom();
        
        return messageElement;
    }
    
    // Add choice buttons
    function addChoices(choices) {
        const choiceButtons = document.createElement('div');
        choiceButtons.classList.add('choice-buttons');
        
        choices.forEach(choice => {
            const button = document.createElement('button');
            button.classList.add('choice-btn');
            button.textContent = choice;
            button.addEventListener('click', function() {
                // Add selected choice as player message
                addMessage('player', 'You', choice);
                
                // Remove choice buttons
                choiceButtons.remove();
                
                // Get GPT response
                getResponseFromGPT(choice);
            });
            
            choiceButtons.appendChild(button);
        });
        
        // Append to last message
        const messages = document.querySelectorAll('.message');
        const lastMessage = messages[messages.length - 1];
        lastMessage.appendChild(choiceButtons);
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    // Process special tags from GPT responses
    function processSpecialTags(text) {
        // Basic implementation - will be expanded
        let cleanText = text;
        
        // Check for stat updates
        const statsMatch = text.match(/::STATS::\s*vitality=(\d+)\s*madness=(\d+)/);
        if (statsMatch) {
            updateStats(parseInt(statsMatch[1]), parseInt(statsMatch[2]));
            cleanText = cleanText.replace(/::STATS::\s*vitality=\d+\s*madness=\d+/, '');
        }
        
        // Check for location updates
        const locationMatch = text.match(/::LOCATION::\s*([^\n]+)/);
        if (locationMatch) {
            updateLocation(locationMatch[1]);
            cleanText = cleanText.replace(/::LOCATION::\s*[^\n]+/, '');
            
            // Show notification for location change
            showNotification('New Location', `You've arrived at ${locationMatch[1]}`);
        }
        
        // Check for notifications
        const notifyMatch = text.match(/::NOTIFICATION::\s*title=([^|]+)\|\s*message=([^\n]+)/);
        if (notifyMatch) {
            showNotification(notifyMatch[1].trim(), notifyMatch[2].trim());
            cleanText = cleanText.replace(/::NOTIFICATION::\s*title=[^|]+\|\s*message=[^\n]+/, '');
        }
        
        // Check for choices
        const choicesMatch = text.match(/::CHOICES::\s*([^\n]+)/);
        if (choicesMatch) {
            const choicesText = choicesMatch[1];
            const choices = choicesText.split('|').map(choice => choice.trim());
            
            // Remove the choices tag from the text
            cleanText = cleanText.replace(/::CHOICES::\s*([^\n]+)/, '');
            
            // Schedule choices to be added after the message is displayed
            setTimeout(() => {
                addChoices(choices);
            }, 500);
        }
        
        return cleanText;
    }
    
    // Update character stats
    function updateStats(vitality, madness) {
        characterStats.vitality = vitality;
        characterStats.madness = madness;
        
        // Update UI
        document.getElementById('vitality-value').textContent = `${vitality}/${characterStats.maxVitality}`;
        document.getElementById('vitality-fill').style.width = `${(vitality / characterStats.maxVitality) * 100}%`;
        
        document.getElementById('madness-value').textContent = `${madness}/${characterStats.maxMadness}`;
        document.getElementById('madness-fill').style.width = `${(madness / characterStats.maxMadness) * 100}%`;
    }
    
    // Update location
    function updateLocation(location) {
        characterStats.location = location;
        document.getElementById('current-location').textContent = location;
    }
    
    // Show notification
    function showNotification(title, message) {
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Placeholder for API call to ChatGPT
    function getResponseFromGPT(userMessage) {
        // Show loading indicator
        const loadingMessage = addMessage('narrator', null, 'The world of Calypso shifts around you...');
        
        // In a real implementation, this would be an API call
        // For now, simulate predefined responses
        setTimeout(() => {
            // Remove the loading message
            chatMessages.removeChild(loadingMessage);
            
            let response = '';
            
            // Simple response branching based on the user's message
            if (userMessage.toLowerCase().includes("queen of demons")) {
                response = `The demon's augmented eyes flicker with an unsettling red glow. "Aerith. That's what they call her. Rose from nothing, she did. Started devouring other demons, feeding on their essence. Now she's become something... more." He gestures to his own body, metal and flesh grotesquely fused together. "This? This is the only way to survive in her new world. Augmentation. Adaptation."

::STATS:: vitality=95 madness=10
::NOTIFICATION:: title=Lore Discovered| message=You've learned about Aerith, the Queen of Demons.
::CHOICES:: Tell me more about these augmentations| Where can I find Aerith?| What was Calypso like before her?`;
            } 
            else if (userMessage.toLowerCase().includes("body") || userMessage.toLowerCase().includes("happened to you")) {
                response = `The demon traces a metal-grafted finger along the seam where flesh meets machinery on his face. "Survival. That's all this is. The Queen's presence... it changes us. Makes us weak. Only way to resist is to become something else." He leans closer, voice dropping to a whisper. "There's a doctor in the Deeper Slums. Half-monkey, half-devil thing. Does the work cheap if you bring him... materials."

::STATS:: vitality=95 madness=15
::NOTIFICATION:: title=New Lead| message=You've learned about an augmentation doctor in the Deeper Slums.
::CHOICES:: I need these augmentations too| Take me to this doctor| What kind of "materials" does he need?`;
            }
            else if (userMessage.toLowerCase().includes("slums") || userMessage.toLowerCase().includes("way out")) {
                response = `The demon lets out a harsh laugh that sounds like metal scraping against metal. "Out? There is no 'out' of Calypso. Only deeper in." He points toward a faint glow emanating from the city center. "Those who want salvation go to the Church of Holy Order. Those who want power head to the Arena." His augmented eyes narrow. "But if you're smart, you'll stay away from both."

::STATS:: vitality=95 madness=8
::NOTIFICATION:: title=Locations Discovered| message=You've learned about the Church of Holy Order and the Arena.
::CHOICES:: Tell me about the Church| What's this Arena?| I need to find shelter for now`;
            }
            else {
                // Default response
                response = `The augmented demon studies you with mechanical eyes that whir slightly as they focus. "New here, aren't you? I can smell it on you - the lack of purpose." He gestures around at the decaying buildings and filthy streets. "Welcome to the bottom of the world. Nowhere to go but up... or further down."

::STATS:: vitality=95 madness=5
::LOCATION:: Eastern Slums
::CHOICES:: What happened to this place?| Who are you?| I need to find my way around`;
            }
            
            // Process special tags
            const cleanResponse = processSpecialTags(response);
            
            // Add to conversation history
            conversationHistory.push({
                role: "assistant",
                content: cleanResponse
            });
            
            // Display the clean response
            addMessage('npc', 'Augmented Demon', cleanResponse);
        }, 1500);
    }
});
// Add these functions to your existing JavaScript

// Toggle between HUD and mind map views
function setupToggleButtons() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const panels = document.querySelectorAll('.side-panel');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Toggle active class on buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show appropriate panel
            const view = button.getAttribute('data-view');
            panels.forEach(panel => {
                if (panel.getAttribute('data-panel') === view) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            });
        });
    });
}

// Update location with additional lore
function updateLocationWithLore(location, baseLore, detailedLore = null) {
    // Update location name
    document.getElementById('current-location').textContent = location;
    
    // Update lore text with base information
    document.getElementById('location-lore-text').textContent = baseLore;
    
    // Store detailed lore for later discovery
    if (detailedLore) {
        document.getElementById('location-lore-text').setAttribute('data-detailed-lore', detailedLore);
    }
    
    // Add lore discovery button if detailed lore exists
    const loreContainer = document.querySelector('.location-lore');
    if (detailedLore && !document.querySelector('.discover-more-btn')) {
        const discoverBtn = document.createElement('button');
        discoverBtn.classList.add('discover-more-btn');
        discoverBtn.textContent = 'Explore';
        discoverBtn.addEventListener('click', expandLoreWithDetail);
        loreContainer.appendChild(discoverBtn);
    }
}

// Expand lore with detailed information
function expandLoreWithDetail() {
    const loreText = document.getElementById('location-lore-text');
    const loreContainer = document.querySelector('.location-lore');
    const detailedLore = loreText.getAttribute('data-detailed-lore');
    
    if (detailedLore) {
        // Expand the container
        loreContainer.classList.add('expanded');
        
        // Add the detailed lore to existing text
        loreText.textContent += '\n\n' + detailedLore;
        
        // Remove the button
        this.remove();
        
        // Show notification
        showNotification('Insight Gained', 'You've discovered new details about this location.');
    }
}

// Add item to equipment slot
function addEquipment(slot, itemName, itemDescription) {
    const equipmentSlot = document.querySelector(`.equipment-slot[data-slot="${slot}"]`);
    if (equipmentSlot) {
        const slotContent = equipmentSlot.querySelector('.slot-content');
        
        // Clear slot first
        slotContent.innerHTML = '';
        
        // Create item
        const itemElement = document.createElement('div');
        itemElement.classList.add('equipment-item');
        itemElement.textContent = itemName;
        itemElement.setAttribute('data-description', itemDescription);
        
        // Add hover effect
        itemElement.addEventListener('mouseenter', function() {
            showItemTooltip(this, itemName, itemDescription);
        });
        
        itemElement.addEventListener('mouseleave', function() {
            hideItemTooltip();
        });
        
        slotContent.appendChild(itemElement);
        
        // Show notification
        showNotification('Equipment Updated', `You've equipped ${itemName}.`);
    }
}

// Show item tooltip
function showItemTooltip(element, name, description) {
    // Remove any existing tooltips
    hideItemTooltip();
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.classList.add('item-tooltip');
    tooltip.innerHTML = `
        <div class="tooltip-title">${name}</div>
        <div class="tooltip-description">${description}</div>
    `;
    
    // Position tooltip
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
    
    // Add show class after a small delay to trigger transition
    setTimeout(() => {
        tooltip.classList.add('show');
    }, 10);
}

// Hide item tooltip
function hideItemTooltip() {
    const existingTooltip = document.querySelector('.item-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

// Update mind map with new location
function updateMindMap(locationId, locationName, x, y) {
    const mindmapContainer = document.querySelector('.mindmap-placeholder');
    
    // Check if node already exists
    let node = document.querySelector(`.mindmap-node[data-location="${locationId}"]`);
    
    if (!node) {
        // Create new node
        node = document.createElement('div');
        node.classList.add('mindmap-node');
        node.setAttribute('data-location', locationId);
        node.innerHTML = `<span>${locationName}</span>`;
        
        // Position the node
        node.style.left = `${x}%`;
        node.style.top = `${y}%`;
        
        // Add event listener
        node.addEventListener('click', function() {
            // Deactivate all nodes
            document.querySelectorAll('.mindmap-node').forEach(n => n.classList.remove('active'));
            
            // Activate this node
            this.classList.add('active');
            
            // Show notification about the location
            showNotification('Mind Map', `You recall your experiences in ${locationName}.`);
        });
        
        mindmapContainer.appendChild(node);
    }
    
    // Show the node
    node.style.opacity = 1;
}

// Call setup when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupToggleButtons();
    
    // Example usage in a real implementation:
    // Add starting slums node to mind map
    setTimeout(() => {
        updateMindMap('slums', 'Slums', 50, 50);
    }, 1000);
});
// Make the toggle buttons work
document.addEventListener('DOMContentLoaded', function() {
    // Get the toggle buttons and panels
    const hudButton = document.querySelector('.toggle-btn[data-view="hud"]');
    const mindMapButton = document.querySelector('.toggle-btn[data-view="mindmap"]');
    const hudPanel = document.querySelector('.side-panel[data-panel="hud"]');
    const mindMapPanel = document.querySelector('.side-panel[data-panel="mindmap"]');
    
    // Set up event listeners for the toggle buttons
    if (hudButton && mindMapButton) {
        hudButton.addEventListener('click', function() {
            // Activate HUD button
            hudButton.classList.add('active');
            mindMapButton.classList.remove('active');
            
            // Show HUD panel, hide Mind Map panel
            hudPanel.classList.remove('hidden');
            mindMapPanel.classList.add('hidden');
        });
        
        mindMapButton.addEventListener('click', function() {
            // Activate Mind Map button
            mindMapButton.classList.add('active');
            hudButton.classList.remove('active');
            
            // Show Mind Map panel, hide HUD panel
            mindMapPanel.classList.remove('hidden');
            hudPanel.classList.add('hidden');
            
            // Add the example Slums node if not already present
            if (!document.querySelector('.mindmap-node')) {
                updateMindMap('slums', 'Slums', 50, 50);
            }
        });
    }
});

// Add the updateMindMap function if it doesn't exist yet
function updateMindMap(locationId, locationName, x, y) {
    const mindmapContainer = document.querySelector('.mindmap-placeholder');
    
    if (!mindmapContainer) return;
    
    // Check if node already exists
    let node = document.querySelector(`.mindmap-node[data-location="${locationId}"]`);
    
    if (!node) {
        // Create new node
        node = document.createElement('div');
        node.classList.add('mindmap-node');
        node.setAttribute('data-location', locationId);
        node.innerHTML = `<span>${locationName}</span>`;
        
        // Position the node
        node.style.left = `${x}%`;
        node.style.top = `${y}%`;
        
        // Add event listener
        node.addEventListener('click', function() {
            // Deactivate all nodes
            document.querySelectorAll('.mindmap-node').forEach(n => n.classList.remove('active'));
            
            // Activate this node
            this.classList.add('active');
            
            // Show notification about the location (placeholder)
            console.log(`You recall your experiences in ${locationName}.`);
        });
        
        mindmapContainer.appendChild(node);
    }
    
    // Show the node (make sure it's visible)
    node.style.opacity = 1;
}
