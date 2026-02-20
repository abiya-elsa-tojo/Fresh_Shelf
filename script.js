// Store items in localStorage
let items = [];
let selectedCategory = sessionStorage.getItem("selectedCategory") || null;

// Load items from storage on page load (use AppStorage wrapper)
function loadItemsFromStorage() {
  try {
    const stored = window.AppStorage && AppStorage.get("freshShelfItems");
    items = Array.isArray(stored) ? stored : [];
    console.log("Loaded items:", items);
  } catch (error) {
    console.error("Error loading items:", error);
    items = [];
  }
}

// Category definitions with icons and colors
const categories = {
  "Dairy": { icon: "🥛", color: "#8B5CF6" },
  "Vegetables": { icon: "🥬", color: "#34D399" },
  "Fruits": { icon: "🍎", color: "#F472B6" },
  "Meats": { icon: "🥩", color: "#F97316" },
  "Seafood": { icon: "🐟", color: "#06B6D4" },
  "Bakery": { icon: "🍞", color: "#FBBF24" },
  "Grains & Pulses": { icon: "🌾", color: "#D97706" },
  "Spices & Condiments": { icon: "🌶️", color: "#EF4444" },
  "Beverages": { icon: "☕", color: "#8B5CF6" }
};

// Get elements
const form = document.getElementById("itemForm");
const categoryFilter = document.getElementById("categoryFilter");
const addItemSection = document.getElementById("addItemSection");
const selectedCategoryName = document.getElementById("selectedCategoryName");
const categoriesContainer = document.getElementById("categoriesContainer");
const emptyState = document.getElementById("emptyState");

// Load items on page load
loadItemsFromStorage();

// Category selection handler
categoryFilter.addEventListener("change", function() {
  selectedCategory = this.value;
  
  if (selectedCategory) {
    console.log("Selected category:", selectedCategory);
    // Navigate to category page
    sessionStorage.setItem("selectedCategory", selectedCategory);
    window.location.href = `category.html?category=${encodeURIComponent(selectedCategory)}`;
  } else {
    selectedCategory = null;
    addItemSection.style.display = "none";
  }
  
  displayItems();
});

// When form is submitted (not used anymore, moved to category.html)
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedCategory) {
      alert("Please select a category first.");
      return;
    }

    const name = document.getElementById("itemName").value.trim();
    const expiry = document.getElementById("expiryDate").value;

    if (!name || !expiry) {
      alert("Please fill in all fields.");
      return;
    }

    items.push({ 
      name, 
      category: selectedCategory,
      expiry, 
      id: Date.now() 
    });

    console.log("Added item:", { name, category: selectedCategory, expiry });
    saveItems();
    displayItems();
    form.reset();
  });
}

// Save items to storage via AppStorage
function saveItems() {
  try {
    if (window.AppStorage) {
      AppStorage.set("freshShelfItems", items);
    } else {
      // fallback
      try { sessionStorage.setItem("freshShelfItems", JSON.stringify(items)); } catch (e) {}
      try { localStorage.setItem("freshShelfItems", JSON.stringify(items)); } catch (e) {}
    }
    console.log("Saved items:", items);
  } catch (error) {
    console.error("Error saving items:", error);
  }
}

// Get status for an item
function getItemStatus(daysLeft) {
  if (daysLeft <= 0) {
    return { status: "Expired", badgeClass: "badge-danger", iconEmoji: "❌", iconClass: "danger" };
  } else if (daysLeft <= 7) {
    return { status: "Expiring Soon", badgeClass: "badge-warning", iconEmoji: "⚠️", iconClass: "warning" };
  } else {
    return { status: "Safe", badgeClass: "badge-safe", iconEmoji: "✓", iconClass: "safe" };
  }
}

// Display items grouped by category (or filtered by selected category)
function displayItems() {
  categoriesContainer.innerHTML = "";

  const today = new Date();
  
  // If a category is selected, show only that category
  if (selectedCategory) {
    const categoryItems = items.filter(item => item.category === selectedCategory);
    
    if (categoryItems.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    const { icon } = categories[selectedCategory];

    // Create category section
    const categorySection = document.createElement("div");
    categorySection.className = "category-section";

    // Category header
    const categoryHeader = document.createElement("div");
    categoryHeader.className = "category-header";
    categoryHeader.innerHTML = `
      <div class="category-icon">${icon}</div>
      <h3 class="category-title">${selectedCategory}</h3>
      <div class="category-count">${categoryItems.length}</div>
    `;

    // Items container
    const itemsContainer = document.createElement("div");
    itemsContainer.className = "category-items";

    // Add items to category
    categoryItems.forEach(item => {
      const expiryDate = new Date(item.expiry);
      const daysLeft = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );

      const { status, badgeClass, iconEmoji, iconClass } = getItemStatus(daysLeft);

      const formattedDate = expiryDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

      const daysText = daysLeft > 0 
        ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` 
        : "Expired";

      // Create item card
      const card = document.createElement("div");
      card.className = "item-card";
      card.setAttribute("data-id", item.id);
      card.innerHTML = `
        <div class="item-header">
          <div class="icon-circle ${iconClass}">${iconEmoji}</div>
          <div class="item-name">${escapeHtml(item.name)}</div>
        </div>
        
        <div class="item-meta">
          <div><strong>Expires:</strong> ${formattedDate}</div>
          <div><strong>Time Left:</strong> ${daysText}</div>
        </div>

        <div style="margin-top: 1rem; margin-bottom: 1rem;">
          <span class="badge ${badgeClass}">${status}</span>
        </div>

        <div class="item-actions">
          <button class="item-delete-btn" data-id="${item.id}">Delete</button>
        </div>
      `;

      itemsContainer.appendChild(card);
    });

    categorySection.appendChild(categoryHeader);
    categorySection.appendChild(itemsContainer);
    categoriesContainer.appendChild(categorySection);
  } else {
    // Show all categories with items
    if (items.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // Group items by category
    const groupedItems = {};
    categories.forEach(cat => {
      groupedItems[Object.keys(categories).find(key => categories[key] === cat)] = [];
    });

    items.forEach(item => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });

    // Create category sections
    Object.keys(categories).forEach(categoryName => {
      const categoryItems = groupedItems[categoryName];
      
      // Only show categories with items
      if (categoryItems.length === 0) {
        return;
      }

      const { icon } = categories[categoryName];

      // Create category section
      const categorySection = document.createElement("div");
      categorySection.className = "category-section";

      // Category header
      const categoryHeader = document.createElement("div");
      categoryHeader.className = "category-header";
      categoryHeader.innerHTML = `
        <div class="category-icon">${icon}</div>
        <h3 class="category-title">${categoryName}</h3>
        <div class="category-count">${categoryItems.length}</div>
      `;

      // Items container
      const itemsContainer = document.createElement("div");
      itemsContainer.className = "category-items";

      // Add items to category
      categoryItems.forEach(item => {
        const expiryDate = new Date(item.expiry);
        const daysLeft = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        const { status, badgeClass, iconEmoji, iconClass } = getItemStatus(daysLeft);

        const formattedDate = expiryDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });

        const daysText = daysLeft > 0 
          ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` 
          : "Expired";

        // Create item card
        const card = document.createElement("div");
        card.className = "item-card";
        card.setAttribute("data-id", item.id);
        card.innerHTML = `
          <div class="item-header">
            <div class="icon-circle ${iconClass}">${iconEmoji}</div>
            <div class="item-name">${escapeHtml(item.name)}</div>
          </div>
          
          <div class="item-meta">
            <div><strong>Expires:</strong> ${formattedDate}</div>
            <div><strong>Time Left:</strong> ${daysText}</div>
          </div>

          <div style="margin-top: 1rem; margin-bottom: 1rem;">
            <span class="badge ${badgeClass}">${status}</span>
          </div>

          <div class="item-actions">
            <button class="item-delete-btn" data-id="${item.id}">Delete</button>
          </div>
        `;

        itemsContainer.appendChild(card);
      });

      categorySection.appendChild(categoryHeader);
      categorySection.appendChild(itemsContainer);
      categoriesContainer.appendChild(categorySection);
    });
  }

  // Attach delete event listeners
  document.querySelectorAll(".item-delete-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const itemId = parseInt(this.getAttribute("data-id"));
      if (confirm("Are you sure you want to delete this item?")) {
        items = items.filter(item => item.id !== itemId);
        saveItems();
        displayItems();
      }
    });
  });
}

// Helper: read and merge items from both storages (used for recipe generation)
function getMergedItems() {
  try {
    // Try AppStorage first
    if (window.AppStorage) {
      const stored = AppStorage.get('freshShelfItems');
      if (Array.isArray(stored) && stored.length > 0) {
        console.log('getMergedItems from AppStorage:', stored);
        return stored;
      }
    }
    
    // Fallback: read from localStorage and sessionStorage directly
    let items = [];
    try {
      const local = localStorage.getItem('freshShelfItems');
      if (local) items = JSON.parse(local);
    } catch (e) { console.error('Error reading localStorage:', e); }
    
    try {
      const session = sessionStorage.getItem('freshShelfItems');
      if (session) {
        const sessionItems = JSON.parse(session);
        if (Array.isArray(sessionItems)) {
          const map = new Map();
          items.forEach(it => map.set(it.id, it));
          sessionItems.forEach(it => map.set(it.id, it));
          items = Array.from(map.values());
        }
      }
    } catch (e) { console.error('Error reading sessionStorage:', e); }
    
    console.log('getMergedItems fallback result:', items);
    return Array.isArray(items) ? items : [];
  } catch (e) { 
    console.error('getMergedItems error:', e);
    return []; 
  }
}

// Generate recipe ideas: render inline modal instead of alert
const recipeBtn = document.getElementById("recipeBtn");
if (recipeBtn) {
  recipeBtn.addEventListener("click", function() {
    console.log('Recipe button clicked, selectedCategory:', selectedCategory);
    const merged = getMergedItems();
    console.log('Merged items:', merged);
    const filtered = selectedCategory ? merged.filter(i => i.category === selectedCategory) : merged.slice();
    console.log('Filtered items for recipe:', filtered);
    showRecipeModal(filtered);
  });
}

function showRecipeModal(list) {
  const backdrop = document.getElementById('recipeBackdrop');
  const modal = document.getElementById('recipeModal');
  const content = document.getElementById('recipeContent');
  if (!backdrop || !modal || !content) return;
  content.innerHTML = '';

  console.log('showRecipeModal received list:', list, 'length:', list ? list.length : 0);

  if (!list || list.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No saved items yet. Add items to get recipe ideas.';
    p.style.color = 'var(--color-muted)';
    content.appendChild(p);
    backdrop.style.display = 'flex';
    modal.style.display = 'block';
    return;
  }

  // Get matching recipes based on available items
  const matchedRecipes = getMatchingRecipes(list);
  console.log('Matched recipes:', matchedRecipes);

  if (matchedRecipes.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No recipes found for your current ingredients.';
    p.style.color = 'var(--color-muted)';
    content.appendChild(p);
    backdrop.style.display = 'flex';
    modal.style.display = 'block';
    return;
  }

  // Create recipe list
  const recipeList = document.createElement('div');
  recipeList.style.maxHeight = '70vh';
  recipeList.style.overflowY = 'auto';

  matchedRecipes.forEach((recipe, index) => {
    const recipeCard = document.createElement('div');
    recipeCard.style.cssText = `
      border: 1px solid var(--color-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%);
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    recipeCard.onmouseover = () => {
      recipeCard.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.15)';
      recipeCard.style.transform = 'translateY(-2px)';
    };
    recipeCard.onmouseout = () => {
      recipeCard.style.boxShadow = 'none';
      recipeCard.style.transform = 'translateY(0)';
    };

    // Recipe header
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;';
    
    const titleDiv = document.createElement('div');
    const title = document.createElement('h3');
    title.style.cssText = 'margin: 0 0 0.25rem 0; color: var(--color-foreground); font-size: 1.125rem;';
    title.textContent = recipe.name;
    
    const matchBadge = document.createElement('span');
    matchBadge.style.cssText = `
      background: linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    `;
    matchBadge.textContent = `${Math.round(recipe.matchPercentage)}% match`;
    
    titleDiv.appendChild(title);
    header.appendChild(titleDiv);
    header.appendChild(matchBadge);

    // Recipe meta
    const meta = document.createElement('div');
    meta.style.cssText = 'display: flex; gap: 1rem; margin-bottom: 0.75rem; color: var(--color-muted); font-size: 0.875rem;';
    meta.innerHTML = `
      <span>📂 ${escapeHtml(recipe.category)}</span>
      <span>⏱️ ${escapeHtml(recipe.time)}</span>
      <span>🎯 ${escapeHtml(recipe.difficulty)}</span>
    `;

    // Required ingredients
    const ingredientsDiv = document.createElement('div');
    ingredientsDiv.style.marginBottom = '0.75rem';
    const ingredientsLabel = document.createElement('strong');
    ingredientsLabel.style.cssText = 'color: var(--color-foreground); display: block; margin-bottom: 0.5rem;';
    ingredientsLabel.textContent = 'Requires:';
    
    const ingredientsList = document.createElement('div');
    ingredientsList.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap;';
    recipe.ingredients.forEach(ing => {
      const badge = document.createElement('span');
      badge.style.cssText = `
        background: rgba(139, 92, 246, 0.2);
        color: var(--color-foreground);
        padding: 0.25rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      `;
      badge.textContent = escapeHtml(ing);
      ingredientsList.appendChild(badge);
    });
    
    ingredientsDiv.appendChild(ingredientsLabel);
    ingredientsDiv.appendChild(ingredientsList);

    // Instructions (click to expand)
    const instructionsDiv = document.createElement('div');
    instructionsDiv.style.marginTop = '0.75rem';
    const instructionsLabel = document.createElement('strong');
    instructionsLabel.style.cssText = 'color: var(--color-foreground); display: block; margin-bottom: 0.5rem;';
    instructionsLabel.textContent = 'Instructions:';
    
    const instructionsText = document.createElement('div');
    instructionsText.style.cssText = 'color: var(--color-muted); font-size: 0.875rem; white-space: pre-wrap; line-height: 1.5;';
    instructionsText.textContent = escapeHtml(recipe.instructions);
    
    instructionsDiv.appendChild(instructionsLabel);
    instructionsDiv.appendChild(instructionsText);

    // Assemble recipe card
    recipeCard.appendChild(header);
    recipeCard.appendChild(meta);
    recipeCard.appendChild(ingredientsDiv);
    recipeCard.appendChild(instructionsDiv);
    recipeList.appendChild(recipeCard);
  });

  content.appendChild(recipeList);
  backdrop.style.display = 'flex';
  modal.style.display = 'block';
}

function hideRecipeModal() {
  const backdrop = document.getElementById('recipeBackdrop');
  const modal = document.getElementById('recipeModal');
  if (backdrop) backdrop.style.display = 'none';
  if (modal) modal.style.display = 'none';
}

// Close handlers
const recipeCloseBtn = document.getElementById('recipeClose');
if (recipeCloseBtn) recipeCloseBtn.addEventListener('click', hideRecipeModal);
const recipeBackdrop = document.getElementById('recipeBackdrop');
if (recipeBackdrop) recipeBackdrop.addEventListener('click', function(e) {
  if (e.target === recipeBackdrop) hideRecipeModal();
});

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Recipe database with common recipes and their ingredients
const recipeDatabase = [
  {
    name: "Fresh Salad",
    category: "Salads",
    ingredients: ["vegetables", "fruits"],
    instructions: "1. Wash and chop fresh vegetables\n2. Add fruits for sweetness\n3. Toss together\n4. Drizzle with your favorite dressing",
    difficulty: "Easy",
    time: "10 mins"
  },
  {
    name: "Vegetable Stir-Fry",
    category: "Main Course",
    ingredients: ["vegetables", "meats"],
    instructions: "1. Heat oil in a pan\n2. Add vegetables and stir-fry\n3. Add meat for protein\n4. Season and serve hot",
    difficulty: "Medium",
    time: "20 mins"
  },
  {
    name: "Milk Smoothie",
    category: "Beverages",
    ingredients: ["beverages", "fruits", "dairy"],
    instructions: "1. Pour milk in blender\n2. Add fresh fruits\n3. Blend until smooth\n4. Add honey if needed",
    difficulty: "Easy",
    time: "5 mins"
  },
  {
    name: "Grilled Meat with Vegetables",
    category: "Main Course",
    ingredients: ["meats", "vegetables"],
    instructions: "1. Season meat with spices\n2. Grill until cooked\n3. Grill vegetables separately\n4. Serve together hot",
    difficulty: "Medium",
    time: "30 mins"
  },
  {
    name: "Fish Curry",
    category: "Main Course",
    ingredients: ["seafood", "spices", "vegetables"],
    instructions: "1. Heat oil and add spices\n2. Add chopped vegetables\n3. Add seafood\n4. Simmer until cooked, serve with rice",
    difficulty: "Hard",
    time: "40 mins"
  },
  {
    name: "Cheese Toast",
    category: "Breakfast",
    ingredients: ["bakery", "dairy"],
    instructions: "1. Toast bread until golden\n2. Add cheese on top\n3. Toast again until cheese melts\n4. Serve warm",
    difficulty: "Easy",
    time: "5 mins"
  },
  {
    name: "Rice with Vegetables",
    category: "Main Course",
    ingredients: ["grains", "vegetables"],
    instructions: "1. Cook rice in water\n2. Stir-fry vegetables separately\n3. Mix with cooked rice\n4. Season and serve",
    difficulty: "Medium",
    time: "25 mins"
  },
  {
    name: "Fruit Parfait",
    category: "Dessert",
    ingredients: ["fruits", "dairy"],
    instructions: "1. Layer yogurt in a glass\n2. Add fresh fruits\n3. Repeat layers\n4. Top with honey and enjoy",
    difficulty: "Easy",
    time: "5 mins"
  },
  {
    name: "Spiced Rice",
    category: "Main Course",
    ingredients: ["grains", "spices", "vegetables"],
    instructions: "1. Heat oil with spices\n2. Add rice and stir\n3. Add vegetables\n4. Cook until fluffy",
    difficulty: "Medium",
    time: "20 mins"
  },
  {
    name: "Seafood Pasta",
    category: "Main Course",
    ingredients: ["seafood", "grains", "vegetables"],
    instructions: "1. Cook pasta\n2. Sauté seafood with vegetables\n3. Mix with pasta\n4. Add condiments and serve",
    difficulty: "Hard",
    time: "35 mins"
  }
];

// Function to match recipes based on available items
function getMatchingRecipes(items) {
  if (!items || items.length === 0) return [];
  
  const itemCategories = items.map(item => item.category.toLowerCase());
  
  const recipes = recipeDatabase.map(recipe => {
    const matchedIngredients = recipe.ingredients.filter(reqCat => 
      itemCategories.some(itemCat => itemCat.includes(reqCat.toLowerCase()) || reqCat.toLowerCase().includes(itemCat))
    );
    
    const matchPercentage = (matchedIngredients.length / recipe.ingredients.length) * 100;
    
    return {
      ...recipe,
      matchPercentage,
      matchedIngredients
    };
  })
  .filter(recipe => recipe.matchPercentage > 0)
  .sort((a, b) => b.matchPercentage - a.matchPercentage);
  
  return recipes;
}

// Display items on page load
displayItems();