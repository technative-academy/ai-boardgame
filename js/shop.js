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
    this.searchButton.addEventListener("click", (e) => this.search(e));

    if (this.offerButton) {
      this.offerButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.searchInput.value = "offer";
        this.isOfferSearch = true;
        this.search();
      });
    }

    if (this.sortSelect) {
      this.sortSelect.addEventListener("change", () => this.search());
    }
    this.checkInput();
    this.search();
  }

  checkInput() {
    this.searchButton.disabled = this.searchInput.value.length === 0;
  }

  async search(e) {
    if (e) e.preventDefault();

    this.loading.classList.add("is-loading");
    this.productsContainer.classList.remove("is-shown");
    this.searchResultCount.textContent = "";

    while (this.productsList.firstChild) {
      this.productsList.removeChild(this.productsList.lastChild);
    }

    try {
      let query;

      if (this.isOfferSearch) {
        query = "offer";
      } else {
        query = this.buildQuery();
      }
      console.log("query=" + query);

      const sort = this.getSort();
      const results = await fetchProducts({ query, sort });
      console.log("results:", results);
      const products = results.map((product, index) =>
        this.mapProduct(product, index)
      );
      this.processProducts(products);
    } catch (error) {
      console.error(error.message);
      this.searchResultCount.textContent = "0 products found";
      this.productsContainer.classList.remove("is-shown");
    } finally {
      this.loading.classList.remove("is-loading");
    }
    this.isOfferSearch = false;
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
      return "price";
    }
    const value = this.sortSelect.value.toLowerCase();
    if (value.includes("price")) return "price";
    if (value.includes("rating")) return "rating";
    if (value.includes("title")) return "title";
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

  formatPrice(price) {
    if (price === null || price === undefined) {
      return "£0.00";
    }
    const numeric = Number(price);
    if (Number.isFinite(numeric)) {
      return `£${numeric.toFixed(2)}`;
    }
    if (typeof price === "string") {
      return price.startsWith("£") ? price : `£${price}`;
    }
    return "£0.00";
  }

  processProducts(products) {
    const items = Array.isArray(products) ? products : [];

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
