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
    const stored = window.AppStorage ? AppStorage.get('freshShelfItems') : null;
    return Array.isArray(stored) ? stored : [];
  } catch (e) { return []; }
}

// Generate recipe ideas: render inline modal instead of alert
const recipeBtn = document.getElementById("recipeBtn");
if (recipeBtn) {
  recipeBtn.addEventListener("click", function() {
    const merged = getMergedItems();
    const filtered = selectedCategory ? merged.filter(i => i.category === selectedCategory) : merged.slice();
    showRecipeModal(filtered);
  });
}

function showRecipeModal(list) {
  const backdrop = document.getElementById('recipeBackdrop');
  const modal = document.getElementById('recipeModal');
  const content = document.getElementById('recipeContent');
  if (!backdrop || !modal || !content) return;
  content.innerHTML = '';

  if (!list || list.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No saved items yet. Add items to get recipe ideas.';
    p.style.color = 'var(--color-muted)';
    content.appendChild(p);
  } else {
    const title = document.createElement('p');
    title.style.marginBottom = '0.5rem';
    title.style.color = 'var(--color-foreground)';
    title.textContent = 'Ingredients:';
    content.appendChild(title);

    const ul = document.createElement('ul');
    ul.className = 'recipe-list';
    // show unique ingredient names
    const names = Array.from(new Set(list.map(i => i.name)));
    names.forEach(n => {
      const li = document.createElement('li');
      li.textContent = n;
      ul.appendChild(li);
    });
    content.appendChild(ul);

    // Quick suggestions section (search links and simple combos)
    const suggestionsWrap = document.createElement('div');
    suggestionsWrap.className = 'recipe-suggestions';

    // Suggest a google search for recipes using these ingredients
    const query = encodeURIComponent(names.join(', '));
    const search = document.createElement('a');
    search.className = 'btn-primary';
    search.href = `https://www.google.com/search?q=${query}+recipes`;
    search.target = '_blank';
    search.rel = 'noopener';
    search.textContent = 'Search recipes online';
    suggestionsWrap.appendChild(search);

    // Simple heuristic suggestions (pair first 2 items)
    if (names.length >= 2) {
      const combo = document.createElement('div');
      combo.className = 'recipe-suggestion';
      combo.textContent = `Try combining ${names[0]} + ${names[1]}`;
      suggestionsWrap.appendChild(combo);
    }
    if (names.length >= 3) {
      const combo2 = document.createElement('div');
      combo2.className = 'recipe-suggestion';
      combo2.textContent = `Try a salad or stir-fry with ${names.slice(0,3).join(', ')}`;
      suggestionsWrap.appendChild(combo2);
    }

    content.appendChild(suggestionsWrap);
  }

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

// Display items on page load
displayItems();