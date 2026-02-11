import { AI_BASE_URL, fetchProducts } from "./api.js";

class Shop {
  constructor() {
    this.searchContainer = document.querySelector(".search");
    if (this.searchContainer) {
      this.searchInput = this.searchContainer.querySelector(".search__input");
      this.searchButton = this.searchContainer.querySelector(".search__submit");
      this.offerButton = this.searchContainer.querySelector(".search__offer");
      this.isOfferSearch = false;
      this.searchResultCount = this.searchContainer.querySelector(
        ".search__result-count"
      );
      this.sortSelect = this.searchContainer.querySelector(".search__sort");
      this.loading = this.searchContainer.querySelector(".search__loading");

      this.productsContainer = document.querySelector(".products");
      this.productsList =
        this.productsContainer.querySelector(".products__list");
    }
  }

  init() {
    if (!this.searchContainer) return;
    this.searchInput.addEventListener("input", (e) => this.checkInput(e));
    this.searchButton.addEventListener("click", (e) =>
      this.search(e, { scrollToProducts: true })
    );

    if (this.offerButton) {
      this.offerButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.searchInput.value = "offer";
        this.isOfferSearch = true;
        this.search(undefined, { scrollToProducts: true });
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", (e) =>
        this.search(e, { scrollToProducts: true, preserveResults: true })
      );
    }
    this.checkInput();
    this.search();
  }

  checkInput() {
    this.searchButton.disabled = this.searchInput.value.length === 0;
  }

  async search(
    e,
    { scrollToProducts = false, preserveResults = false } = {}
  ) {
    if (e) e.preventDefault();

    this.loading.classList.add("is-loading");
    if (!preserveResults) {
      this.productsContainer.classList.remove("is-shown");
      this.searchResultCount.textContent = "";
      this.clearProductsList();
    }

    try {
      let query;

      if (this.isOfferSearch) {
        query = "offer";
      } else {
        query = this.buildQuery();
      }
      console.log("query=" + query);

      const selectedSort = this.getSort();
      const sort = this.getApiSort(selectedSort);
      const results = await fetchProducts({ query, sort });
      console.log("results:", results);
      const products = results.map((product, index) =>
        this.mapProduct(product, index)
      );
      const sortedProducts = this.sortProducts(products, selectedSort);
      this.processProducts(sortedProducts);
      if (scrollToProducts) {
        this.scrollToProducts();
      }
    } catch (error) {
      console.error(error.message);
      this.searchResultCount.textContent = "0 products found";
      this.productsContainer.classList.remove("is-shown");
    } finally {
      this.loading.classList.remove("is-loading");
    }
    this.isOfferSearch = false;
  }

  scrollToProducts() {
    if (!this.productsContainer?.classList.contains("is-shown")) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    this.productsContainer.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  clearProductsList() {
    while (this.productsList.firstChild) {
      this.productsList.removeChild(this.productsList.lastChild);
    }
  }

  buildQuery() {
    const term = this.searchInput.value.trim();
    if (term.length > 0) {
      return term;
    }
    return "";
  }

  getSort() {
    if (!this.sortSelect) {
      return "price-asc";
    }
    const allowedSorts = ["price-asc", "price-desc", "rating", "title"];
    const selectedSort = this.sortSelect.value.toLowerCase();
    return allowedSorts.includes(selectedSort) ? selectedSort : "price-asc";
  }

  getApiSort(selectedSort) {
    if (selectedSort === "rating" || selectedSort === "title") {
      return selectedSort;
    }
    return "price";
  }

  mapProduct(product, index) {
    const title =
      product && typeof product.title === "string" && product.title.length > 0
        ? product.title
        : `Product ${index + 1}`;
    const description =
      product &&
      typeof product.description === "string" &&
      product.description.length > 0
        ? product.description
        : "No description available.";

    return {
      image: this.resolveImageUrl(product?.image, title),
      title,
      description,
      stars: this.normaliseStars(product?.stars),
      priceValue: this.parsePrice(product?.price) ?? 0,
      price: this.formatPrice(product?.price),
    };
  }

  resolveImageUrl(image, title) {
    if (typeof image === "string" && image.trim().length > 0) {
      try {
        return new URL(image, AI_BASE_URL).toString();
      } catch (error) {}
    }
    return this.buildPlaceholderImage(title);
  }

  buildPlaceholderImage(title) {
    return `https://placehold.co/600x400/0b1f2a/f8f5e6?text=${encodeURIComponent(
      title
    )}`;
  }

  normaliseStars(stars) {
    const numeric = Number(stars);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    const rounded = Math.round(numeric);
    return Math.min(5, Math.max(1, rounded));
  }

  parsePrice(price) {
    if (price === null || price === undefined) {
      return null;
    }

    const numeric = Number(price);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    if (typeof price === "string") {
      const cleaned = price.replace(/[^0-9.-]/g, "");
      if (cleaned.length === 0) {
        return null;
      }
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  formatPrice(price) {
    const numeric = this.parsePrice(price);
    if (numeric !== null) {
      return `£${numeric.toFixed(2)}`;
    }
    if (typeof price === "string") {
      return price.startsWith("£") ? price : `£${price}`;
    }
    return "£0.00";
  }

  sortProducts(products, selectedSort) {
    const items = Array.isArray(products) ? [...products] : [];

    if (selectedSort === "price-desc") {
      return items.sort((a, b) => b.priceValue - a.priceValue);
    }

    if (selectedSort === "rating") {
      return items.sort(
        (a, b) => b.stars - a.stars || a.priceValue - b.priceValue
      );
    }

    if (selectedSort === "title") {
      return items.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    }

    return items.sort((a, b) => a.priceValue - b.priceValue);
  }

  processProducts(products) {
    const items = Array.isArray(products) ? products : [];
    this.clearProductsList();

    this.searchResultCount.textContent = `${items.length} products found`;

    if (items.length > 0) {
      this.productsContainer.classList.add("is-shown");
    } else {
      this.productsContainer.classList.remove("is-shown");
    }

    items.forEach((product) => {
      const productsItem = document.createElement("div");
      productsItem.classList.add("products__item");
      this.productsList.appendChild(productsItem);

      const childProductsItem = document.createElement("div");
      childProductsItem.classList.add("products__img-container");
      productsItem.appendChild(childProductsItem);
      const productsItemImage = document.createElement("img");
      productsItemImage.classList.add("products__item-image");
      productsItemImage.src = product.image;
      childProductsItem.appendChild(productsItemImage);

      const productsItemTitle = document.createElement("h3");
      productsItemTitle.classList.add("products__item-title");
      productsItemTitle.textContent = product.title;
      productsItem.appendChild(productsItemTitle);

      const productsItemDescription = document.createElement("p");
      productsItemDescription.classList.add("products__item-description");
      productsItemDescription.textContent = product.description;
      productsItem.appendChild(productsItemDescription);

      const productsItemStars = document.createElement("p");
      productsItemStars.classList.add("products__item-stars");
      productsItemStars.textContent = "⭐".repeat(product.stars);
      productsItem.appendChild(productsItemStars);

      const productsItemPrice = document.createElement("p");
      productsItemPrice.classList.add("products__item-price");
      productsItemPrice.textContent = product.price;
      productsItem.appendChild(productsItemPrice);
    });
  }
}

// Expose an instance of the 'Shop' class
export default new Shop();
